// ============================================================
// 图片压缩工具
// 用法: node compress-images.js [相册ID]
//
// 不传参数: 压缩所有相册的所有图片（含封面）
// 传相册ID: 只压缩该相册的图片，如 node compress-images.js new-zealand
//
// 压缩标准:
//   - 最大宽度: 2000px（高度按比例缩放）
//   - JPEG 质量: 80
//   - 保留 EXIF 中的方向信息，移除其余元数据
//   - 输出格式: JPEG（统一）
//
// 新增相册工作流:
//   1. 将原始照片放入 images/photos/<album-id>/
//   2. 在 albums/data.js 中添加相册配置
//   3. 运行 node compress-images.js <album-id>
//   4. 确认图片质量无问题后即可部署
// ============================================================

const fs = require('fs');
const path = require('path');

// 压缩配置（可按需调整）
const CONFIG = {
  maxWidth: 2000,       // 最大宽度（px）
  quality: 80,          // JPEG 质量（1-100）
  coverMaxWidth: 1200,  // 封面图最大宽度（首页缩略图不需要太大）
  coverQuality: 80,     // 封面图质量
};

const IMAGES_DIR = path.join(__dirname, 'images');
const PHOTOS_DIR = path.join(IMAGES_DIR, 'photos');
const COVERS_DIR = path.join(IMAGES_DIR, 'covers');

async function compressImage(filePath, maxWidth, quality) {
  const sharp = require('sharp');

  const stats = fs.statSync(filePath);
  const originalSize = stats.size;

  // 读取图片信息
  const image = sharp(filePath);
  const metadata = await image.metadata();

  // 如果宽度已经小于限制且文件小于 500KB，跳过
  if (metadata.width <= maxWidth && originalSize < 500 * 1024) {
    return { skipped: true, originalSize, newSize: originalSize };
  }

  // 压缩处理
  const options = {
    width: metadata.width > maxWidth ? maxWidth : undefined,
    withoutEnlargement: true,
  };

  const tempPath = filePath + '.tmp';

  await sharp(filePath)
    .resize(options.width, null, { withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toFile(tempPath);

  // 替换原文件
  const newStats = fs.statSync(tempPath);
  fs.unlinkSync(filePath);
  fs.renameSync(tempPath, filePath);

  return {
    skipped: false,
    originalSize,
    newSize: newStats.size,
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function compressAlbum(albumId) {
  const albumDir = path.join(PHOTOS_DIR, albumId);
  if (!fs.existsSync(albumDir)) {
    console.error(`错误: 找不到相册目录 ${albumDir}`);
    return;
  }

  const files = fs.readdirSync(albumDir).filter(f =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );

  console.log(`\n📷 压缩相册: ${albumId} (${files.length} 张照片)`);
  console.log('─'.repeat(50));

  let totalOriginal = 0;
  let totalNew = 0;

  for (const file of files) {
    const filePath = path.join(albumDir, file);
    try {
      const result = await compressImage(filePath, CONFIG.maxWidth, CONFIG.quality);
      totalOriginal += result.originalSize;
      totalNew += result.newSize;

      if (result.skipped) {
        console.log(`  ⏭  ${file} (已经足够小，跳过)`);
      } else {
        const ratio = ((1 - result.newSize / result.originalSize) * 100).toFixed(0);
        console.log(`  ✓  ${file}: ${formatSize(result.originalSize)} → ${formatSize(result.newSize)} (-${ratio}%)`);
      }
    } catch (err) {
      console.error(`  ✗  ${file}: ${err.message}`);
    }
  }

  // 压缩封面图（如果存在独立封面）
  const coverPath = path.join(COVERS_DIR, albumId + '.jpg');
  if (fs.existsSync(coverPath)) {
    try {
      const result = await compressImage(coverPath, CONFIG.coverMaxWidth, CONFIG.coverQuality);
      totalOriginal += result.originalSize;
      totalNew += result.newSize;
      if (!result.skipped) {
        const ratio = ((1 - result.newSize / result.originalSize) * 100).toFixed(0);
        console.log(`  ✓  [封面] ${albumId}.jpg: ${formatSize(result.originalSize)} → ${formatSize(result.newSize)} (-${ratio}%)`);
      }
    } catch (err) {
      console.error(`  ✗  [封面] ${err.message}`);
    }
  }

  console.log('─'.repeat(50));
  const totalRatio = totalOriginal > 0 ? ((1 - totalNew / totalOriginal) * 100).toFixed(0) : 0;
  console.log(`  合计: ${formatSize(totalOriginal)} → ${formatSize(totalNew)} (-${totalRatio}%)\n`);
}

async function compressAll() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error('错误: 找不到 images/photos/ 目录');
    process.exit(1);
  }

  const albums = fs.readdirSync(PHOTOS_DIR).filter(f =>
    fs.statSync(path.join(PHOTOS_DIR, f)).isDirectory()
  );

  console.log('============================================================');
  console.log(' VOYAGER 图片压缩工具');
  console.log(`  标准: 最大宽度 ${CONFIG.maxWidth}px / JPEG 质量 ${CONFIG.quality}`);
  console.log('============================================================');

  for (const album of albums) {
    await compressAlbum(album);
  }

  console.log('✅ 全部完成！');
}

// 主入口
(async () => {
  try {
    require('sharp');
  } catch (e) {
    console.error('错误: 需要先安装 sharp 依赖');
    console.error('请运行: npm install sharp');
    process.exit(1);
  }

  const targetAlbum = process.argv[2];

  if (targetAlbum) {
    await compressAlbum(targetAlbum);
    console.log('✅ 完成！');
  } else {
    await compressAll();
  }
})();
