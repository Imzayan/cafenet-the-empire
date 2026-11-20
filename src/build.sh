#!/bin/bash
# ساختِ cafnet.html — آنلاین در v1.3.0 حذف شدِ سورس (۵ هسته + روایت + آنلاین + فروشگاه)
set -e
cd "$(dirname "$0")"
cat p1_head.html p2_core.js p9_assets.js p9b_embed.js p3_sim.js p4_scene.js p4b_gfx.js p6_story.js p8_store.js p5_ui.js p10_update.js > ../cafnet.html
echo '</body>' >> ../cafnet.html
echo '</html>' >> ../cafnet.html
echo "built: ../cafnet.html ($(wc -c < ../cafnet.html) bytes)"
