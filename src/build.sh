#!/bin/bash
# ساختِ cafnet.html از ۷ ماژولِ سورس (۵ هسته + روایت + آنلاین)
set -e
cd "$(dirname "$0")"
cat p1_head.html p2_core.js p3_sim.js p4_scene.js p6_story.js p7_online.js p5_ui.js > ../cafnet.html
echo "built: ../cafnet.html ($(wc -c < ../cafnet.html) bytes)"
