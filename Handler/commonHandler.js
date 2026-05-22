const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client } = require("../config/awsConfig");

exports.getUploadUrl = async (req, res) => {
  const { fileName, fileType, folder, type } = req.body;
  // for uploading return images and videos
  if (type === "customerReturn") {
    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME_RETURN_ITEMS,
      Key: key,
      ContentType: fileType,
      ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return res.json({
      uploadUrl,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME_RETURN_ITEMS}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  }
  // for uploading review images and videos
  else if (type === "customerReview") {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(
      currentDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${currentDate.getDate().toString().padStart(2, "0")}`;
    const key = `${folder}/${formattedDate}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_REVIEW_IMAGES_VIDEOS,
      Key: key,
      ContentType: fileType,
      ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return res.json({
      uploadUrl,
      fileUrl: `https://${process.env.AWS_BUCKET_REVIEW_IMAGES_VIDEOS}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  }
};
