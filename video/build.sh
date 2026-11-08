#!/usr/bin/env bash
# Assemble the pitch video from ten slide stills and ten voice takes.
#
#   video/slides/slide-NN.png   exported from docs/deck/deck.pdf (pdftoppm)
#   video/audio/slide-NN.<ext>  one take per slide: m4a, mp3, wav, aac or caf
#
# One take per slide is the whole point. A fluffed line is re-recorded as that
# slide's take, not cut out of a long one, so nothing here ever has to splice
# mid-sentence.
#
# Levelling is done with a measured gain, not with loudnorm. loudnorm runs a
# ~2.4s lookahead buffer in single-pass mode, which came out as dead air at
# every slide change and pushed an 8:12 script to 8:36 on screen. Instead each
# take is measured with volumedetect, and one gain is applied that brings its
# mean up to TARGET_MEAN without letting any peak past PEAK_CEIL. No latency,
# so the segment length is exactly what --check predicts.
#
#   ./build.sh          build video/pitch.mp4
#   ./build.sh --check  report per-slide durations and the total, build nothing
set -euo pipefail
cd "$(dirname "$0")"

LEAD_MS=350          # silence before the voice starts on each slide
TAIL_S=0.45          # silence after it ends, before the slide changes
TARGET_MEAN=-20.0    # dBFS, perceived level to bring every take to
PEAK_CEIL=-1.5       # dBFS, no sample may exceed this after the gain

# Voice chain, applied before the level is measured so the measurement sees
# what the listener will. Two filters only, both chosen from the recording
# rather than from habit:
#
#   highpass=75   The takes carry -42.5 dB below 80 Hz against -20.1 dB in the
#                 speech band. That is room and handling noise, not voice: the
#                 lowest female fundamental is around 165 Hz and the lowest
#                 male around 85 Hz, so 75 Hz removes only what nobody wants.
#   acompressor   Gentle, 2.5:1 with a soft knee, to close the gap between a
#                 confident sentence and a quiet one. Attack is slow enough
#                 (8 ms) to leave consonants intact.
#
# Deliberately NOT here: denoising. The measured noise floor is -54.9 dB, which
# is clean, and afftdn on clean speech buys nothing and can warble. Also no
# de-essing, because judging sibilance needs ears.
#
# TEMPO time-stretches the speech. Default 1.0, meaning OFF, and it should
# stay off.
#
# Tried and rejected. The delivery measures 5.06 to 5.20 syllables a second
# against a 3.5 to 4.0 presentation norm, so stretching looked like the fix:
# 0.88 reached 4.40 and 0.78 reached 4.04, both inside the target. Both were
# rejected on listening as "slow motion", and that is the right call. atempo
# slows every syllable by the same factor, including the ones that were fast
# on purpose, so it does not make a delivery measured, it makes it uniform.
# Uniform is what a listener hears as boring, and the numeric target was met
# while the thing the target was a proxy for got worse.
#
# Pace is a performance problem. The script carries delivery notes instead.
TEMPO="${TEMPO:-1.0}"

VOICE_CHAIN="highpass=f=75,acompressor=threshold=-21dB:ratio=2.5:attack=8:release=180:knee=6,atempo=${TEMPO}"

CHECK=0
[ "${1:-}" = "--check" ] && CHECK=1

# A slide may be recorded in one take or in lettered parts, so that a long
# block can be read in pieces without re-recording the whole thing:
#   audio/slide-03.m4a                        one take
#   audio/slide-03a.m4a  audio/slide-03b.m4a  two parts, joined in letter order
# Parts are joined by trimming each one's edge silence back to EDGE_KEEP and
# butting them together, so the seam is EDGE_KEEP*2 of the room's own tone.
#
# It used to insert anullsrc between parts, and that was audible: the takes
# carry room tone at about -50 dB, anullsrc is true digital zero, so the seam
# went room -> nothing -> room and the ear heard the room disappear. Splicing
# her own tone to her own tone has no such edge. Nothing synthetic is inserted
# mid-slide at all now.
#
# Digital padding still brackets the whole slide (LEAD_MS/TAIL_S), which is
# fine: that lands on a picture cut, where the eye covers for the ear.
# A whole take wins over parts if both somehow exist.
EDGE_KEEP=0.45       # room tone left at each end of a part
EDGE_THRESH=-42      # dB; quieter than this at an edge counts as room tone
XFADE=0.35           # parts are crossfaded over this, not butt-spliced
#
# Butting the parts together on their own room tone was not enough. Measured
# across a join: part a's tail decayed to -54.5 dB and part b's head opened at
# -50.3, a 4 dB step, because the two parts get different levelling gains and
# that moves their room tone as well as their speech. A 4 dB step in a quiet
# passage is plainly audible even though nothing is silent.
#
# A crossfade turns the step into a ramp and covers any phase discontinuity at
# the splice. EDGE_KEEP has to exceed XFADE, since the fade eats the overlap:
# 0.45 each side less a 0.35 fade still leaves about 0.55 s of gap, which is a
# sentence break.

find_take() {                      # find_take 03 -> every file for slide 3, in order
  local n=$1 found=""
  for ext in m4a mp3 wav aac caf flac m4v mov; do
    [ -f "audio/slide-$n.$ext" ] && { echo "audio/slide-$n.$ext"; return; }
  done
  for part in a b c d e f; do
    for ext in m4a mp3 wav aac caf flac m4v mov; do
      [ -f "audio/slide-$n$part.$ext" ] && { found="$found audio/slide-$n$part.$ext"; break; }
    done
  done
  echo $found
}

# Where the speech actually starts and ends, with EDGE_KEEP of room tone left
# on either side. Echoes "start end" for use with atrim.
speech_bounds() {
  local f=$1
  local dur; dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  ffmpeg -nostdin -v info -i "$f" \
    -af "silencedetect=noise=${EDGE_THRESH}dB:d=0.08" -f null - 2>&1 \
  | python3 -c '
import re, sys
log = sys.stdin.read()
dur  = float("'"$dur"'"); keep = float("'"$EDGE_KEEP"'")
starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
ends   = [float(x) for x in re.findall(r"silence_end: (-?[\d.]+)", log)]

# Invert the silences into speech spans. Taking the first silence that starts
# at zero does not work: a take opens with several short silences as the
# speaker settles, so the real onset is after the last of them.
spans, cur = [], 0.0
for i, s in enumerate(starts):
    e = ends[i] if i < len(ends) else dur
    if s > cur:
        spans.append((cur, s))
    cur = max(cur, e)
if cur < dur:
    spans.append((cur, dur))

# A real utterance, not a click or a breath between two silences.
real = [(a, b) for a, b in spans if b - a >= 0.25]
if not real:
    print(f"0 {dur:.4f}")
else:
    a = max(0.0, real[0][0] - keep)
    b = min(dur, real[-1][1] + keep)
    print(f"{a:.4f} {b:.4f}" if b > a + 0.2 else f"0 {dur:.4f}")
'
}

take_duration() {                  # total seconds for one slide, parts included
  local total=0
  for f in $1; do
    read -r a b <<< "$(speech_bounds "$f")"
    total=$(python3 -c "print($total + $b - $a)")
  done
  # Divided by TEMPO because atempo lengthens the audio, and this figure sets
  # the segment's -t. Without it the stretched tail is cut off: at TEMPO 0.88
  # that silently truncated more than two seconds from the end of every slide.
  # Each crossfade also overlaps two parts, so the joins shorten the total.
  local n; n=$(echo $1 | wc -w | tr -d ' ')
  python3 -c "print(f'{($total - ($n - 1) * $XFADE) / $TEMPO:.6f}')"
}

gain_for() {                       # measured gain in dB to level this take
  local f=$1
  # volumedetect reports at info level, so -v error would silently hide it and
  # every take would come back with a 0 dB gain.
  # Measured through the voice chain, so the gain corrects what will be heard.
  ffmpeg -nostdin -v info -i "$f" -af "$VOICE_CHAIN,volumedetect" -f null - 2>&1 \
  | python3 -c '
import re, sys
t = sys.stdin.read()
def g(k):
    m = re.search(rf"{k}:\s*(-?[\d.]+) dB", t)
    return float(m.group(1)) if m else None
mean, peak = g("mean_volume"), g("max_volume")
if mean is None or peak is None:
    print("0.0")                       # unreadable: leave the take alone
else:
    print(f"{min('"$TARGET_MEAN"' - mean, '"$PEAK_CEIL"' - peak):.2f}")
'
}

missing=(); total=0; rows=()
for i in $(seq -w 1 10); do
  take=$(find_take "$i")
  if [ -z "$take" ]; then
    missing+=("$i"); rows+=("$(printf '  slide %s   %s' "$i" "(no take yet)")")
    continue
  fi
  d=$(take_duration "$take")
  seg=$(python3 -c "print(f'{float(\"$d\")+$TAIL_S+$LEAD_MS/1000:.2f}')")
  total=$(python3 -c "print(f'{$total+$seg:.2f}')")
  label=$(for f in $take; do basename "$f"; done | paste -sd+ -)
  rows+=("$(printf '  slide %s   %6.2fs voice   %6.2fs on screen   %s' \
            "$i" "$d" "$seg" "$label")")
done

printf '%s\n' "${rows[@]}"
printf '\n  total %s  (%d:%02d)   cap is 10:00\n\n' \
  "$total" "$(python3 -c "print(int($total//60))")" "$(python3 -c "print(int($total%60))")"

if [ ${#missing[@]} -gt 0 ]; then
  echo "  still to record: ${missing[*]}"
  [ $CHECK -eq 1 ] && exit 0
  echo "  (building a partial video from the takes that exist)"
  echo
fi
[ $CHECK -eq 1 ] && exit 0

rm -rf seg && mkdir -p seg
list=seg/list.txt; : > "$list"

for i in $(seq -w 1 10); do
  take=$(find_take "$i") || true
  [ -z "$take" ] && continue
  d=$(take_duration "$take")
  seg=$(python3 -c "print(f'{float(\"$d\")+$TAIL_S+$LEAD_MS/1000:.3f}')")

  # Each part is levelled on its own, because parts recorded minutes apart sit
  # at different distances from the microphone.
  inputs=(); chain=""; parts=""; k=1; gains=""
  for f in $take; do
    g=$(gain_for "$f")
    read -r ta tb <<< "$(speech_bounds "$f")"
    gains="$gains ${g}"
    inputs+=(-i "$f")
    # Trim to the speech plus EDGE_KEEP of room tone, then level. Parts butt
    # straight together: the only thing at a seam is her own room tone.
    chain="$chain[${k}:a]atrim=start=${ta}:end=${tb},asetpts=PTS-STARTPTS,\
aformat=channel_layouts=stereo,${VOICE_CHAIN},volume=${g}dB[p${k}];"
    parts="$parts[p${k}]"
    k=$((k + 1))
  done
  n=$((k - 1))
  if [ "$n" -eq 1 ]; then
    joined="[p1]"
  else
    # Crossfade the parts in sequence: ((p1 x p2) x p3) ...
    prev="[p1]"
    for p in $(seq 2 $n); do
      # qsin, not tri. Room tone is noise, so the two sides are uncorrelated,
      # and a linear (triangular) fade sums their AMPLITUDES while their POWER
      # drops: measured as a 20 dB hole in the middle of the join, which is a
      # louder defect than the 4 dB step it replaced. Quarter-sine is
      # equal-power and holds the level flat across the overlap.
      chain="${chain}${prev}[p${p}]acrossfade=d=${XFADE}:c1=qsin:c2=qsin[x${p}];"
      prev="[x${p}]"
    done
    joined="$prev"
  fi
  chain="${chain}${joined}adelay=$LEAD_MS|$LEAD_MS,apad=pad_dur=$TAIL_S,aresample=48000[a]"

  printf '  slide %s  gain%s dB  ->  %ss\n' "$i" "$gains" "$seg"
  ffmpeg -nostdin -v error -y \
    -loop 1 -i "slides/slide-$i.png" \
    "${inputs[@]}" \
    -filter_complex "$chain" \
    -map 0:v -map "[a]" -t "$seg" \
    -c:v libx264 -preset medium -crf 20 -tune stillimage \
    -pix_fmt yuv420p -r 25 -c:a aac -b:a 192k \
    "seg/seg-$i.mp4"
  echo "file 'seg-$i.mp4'" >> "$list"
done

ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$list" -c copy pitch.mp4
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 pitch.mp4)
printf '\n  wrote %s/pitch.mp4  (%d:%02d)\n' "$PWD" \
  "$(python3 -c "print(int($dur//60))")" "$(python3 -c "print(int($dur%60))")"
