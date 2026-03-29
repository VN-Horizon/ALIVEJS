from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pydub import AudioSegment


TARGET_BITRATE = "64k"
COMPRESSION_LEVEL = "10"


def transcode_mp3_to_ogg(source_file: Path, destination_file: Path) -> None:
	audio = AudioSegment.from_file(source_file)
	audio.export(
		destination_file,
		format="ogg",
		bitrate=TARGET_BITRATE,
		parameters=["-compression_level", COMPRESSION_LEVEL],
	)


def recompress_bgm(source_root: Path, output_root: Path) -> tuple[int, int]:
	source_files = sorted(
		p for p in source_root.rglob("*") if p.is_file() and p.suffix.lower() == ".mp3"
	)
	if not source_files:
		return 0, 0

	converted = 0
	failed = 0
	total = len(source_files)

	def render_progress(done: int) -> None:
		bar_width = 32
		filled = int(bar_width * done / total) if total else 0
		bar = "#" * filled + "-" * (bar_width - filled)
		percent = (done / total) * 100 if total else 100.0
		sys.stdout.write(f"\r[{bar}] {done}/{total} ({percent:5.1f}%)")
		sys.stdout.flush()

	for index, source_file in enumerate(source_files, start=1):
		rel_path = source_file.relative_to(source_root)
		destination_file = (output_root / rel_path).with_suffix(".ogg")
		destination_file.parent.mkdir(parents=True, exist_ok=True)

		try:
			transcode_mp3_to_ogg(source_file, destination_file)
			converted += 1
		except Exception as exc:  # pragma: no cover - keeps batch conversion running.
			failed += 1
			print(f"\n[failed] {source_file}: {exc}")

		render_progress(index)

	print()

	return converted, failed


def main() -> int:
	parser = argparse.ArgumentParser(
		description="Recompress MP3 files to .ogg (64k bitrate, compression level 10)."
	)
	parser.parse_args()

	base_dir = Path(__file__).resolve().parent
	source_root = base_dir / "audio" / "bgm"
	output_root = base_dir.parent / "assets" / "audio" / "bgm"

	if not source_root.exists():
		print(f"Source directory does not exist: {source_root}")
		return 1

	converted, failed = recompress_bgm(source_root, output_root)
	print(
		f"Completed recompression: converted={converted}, failed={failed}, output={output_root}"
	)
	return 1 if failed else 0


if __name__ == "__main__":
	raise SystemExit(main())

