#!/usr/bin/env python3
import os
import json
import argparse


def generate_manifest(directory, output_file):
    """
    Scans the given directory for files and writes a JSON array
    of filenames (sorted) to the output file.
    """
    entries = []
    for entry in os.listdir(directory):
        path = os.path.join(directory, entry)
        if os.path.isfile(path):
            entries.append(entry)
    entries.sort()

    with open(output_file, 'w') as f:
        json.dump(entries, f, indent=2)
    print(f"Wrote {len(entries)} entries to {output_file}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Generate a JSON manifest of files in a directory.'
    )
    parser.add_argument(
        'directory', help='Directory to scan for files'
    )
    parser.add_argument(
        '--output', '-o', help='Output JSON filename (default: <directory>.json)'
    )
    args = parser.parse_args()

    dir_name = args.directory.rstrip('/\\')
    default_manifest = f"{os.path.basename(dir_name)}.json"
    output_file = args.output or default_manifest

    generate_manifest(args.directory, output_file)
