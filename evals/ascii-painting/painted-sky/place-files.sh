#!/usr/bin/env bash
# Copies the case's input image into the run's working directory, since the
# eval sandbox has no network to download it.
set -eu
cp -R "$(dirname "$0")/files/." .
