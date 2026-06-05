const cloudinary = require('cloudinary').v2;
const cron = require('node-cron');
const prisma = require('../prisma');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cron.schedule('0 2 * * *', async () => {
  try {
    const orphans = await prisma.noteImage.findMany({
      where: {
        isOrphaned: true,
        uploadedAt: { lt: new Date(Date.now() - 86400000) },
      },
    });
    for (const img of orphans) {
      await cloudinary.uploader.destroy(img.cloudinaryPublicId);
      await prisma.noteImage.delete({ where: { id: img.id } });
      console.log(`Deleted orphaned Cloudinary image: ${img.cloudinaryPublicId}`);
    }
  } catch (error) {
    console.error('Orphan image cleanup failed:', error);
  }
});
