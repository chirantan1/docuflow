const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ImageService {
  async convert(file, format) {
    try {
      const outputPath = file.path + `.${format}`;
      await sharp(file.path).toFormat(format).toFile(outputPath);
      const result = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => {});
      return result;
    } catch (error) {
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  }

  async compress(file, quality = 80) {
    try {
      const outputPath = file.path + '.compressed';
      await sharp(file.path).jpeg({ quality }).png({ quality }).toFile(outputPath);
      const result = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => {});
      return result;
    } catch (error) {
      throw new Error(`Image compression failed: ${error.message}`);
    }
  }

  async resize(file, width, height) {
    try {
      const outputPath = file.path + '.resized';
      await sharp(file.path).resize(parseInt(width), parseInt(height)).toFile(outputPath);
      const result = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => {});
      return result;
    } catch (error) {
      throw new Error(`Image resize failed: ${error.message}`);
    }
  }

  async crop(file, left, top, width, height) {
    try {
      const outputPath = file.path + '.cropped';
      await sharp(file.path).extract({
        left: parseInt(left),
        top: parseInt(top),
        width: parseInt(width),
        height: parseInt(height)
      }).toFile(outputPath);
      const result = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => {});
      return result;
    } catch (error) {
      throw new Error(`Image crop failed: ${error.message}`);
    }
  }

  async rotate(file, degrees) {
    try {
      const outputPath = file.path + '.rotated';
      await sharp(file.path).rotate(parseInt(degrees)).toFile(outputPath);
      const result = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => {});
      return result;
    } catch (error) {
      throw new Error(`Image rotation failed: ${error.message}`);
    }
  }

  async grayscale(file) {
    try {
      const outputPath = file.path + '.grayscale';
      await sharp(file.path).grayscale().toFile(outputPath);
      const result = await fs.readFile(outputPath);
      await fs.unlink(outputPath).catch(() => {});
      return result;
    } catch (error) {
      throw new Error(`Grayscale conversion failed: ${error.message}`);
    }
  }
}

module.exports = new ImageService();