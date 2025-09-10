const { uploadToCloudinary } = require("../middleware/upload.js");
const MainBanners = require("../models/MainBanners")
// const { PutObjectCommand } = require("@aws-sdk/client-s3");
// const { s3Client } = require('../config/awsConfig.js');
const { processImage, uploadImgOnAWS } = require("../utility/processImage.js");
const path = require('path');



// const uploadToS3 = async (file, Bucket, Key) => {

//     const params = {
//         Bucket,
//         Key: `${Key}/${file.originalname}`,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         ACL: 'public-read'
//     };

//     // return s3.upload(params).promise();
//     await s3Client.send(new PutObjectCommand(params));
//     return `https://${Bucket}.s3.ap-south-1.amazonaws.com/${Key}/${file.originalname}`;
// };

// ==================== get all banners ===============================
exports.getAllMainBanners = async (req, res) => {
    try {
        const mainBanners = await MainBanners.find().sort({ order: 1 }); // 1 for ascending, -1 for descending
        if (mainBanners.length === 0) {
            return res.status(404).json({ message: "No banners found" })
        }
        return res.status(200).json({ mainBanners })
    } catch (error) {
        res.status(500).json({ message: "Error fetching banners", error });
    }
}

// ====================== add new banner (old method) ===============================
// exports.addNewBanner = async (req, res) => {
//     try {
//         const { title, description, redirectionUrl, order } = req.body;
//         const file = req.file;

//         if (!redirectionUrl || !order) {
//             return res.status(400).json({ success: false, message: 'Redirectional Url is required' })
//         }

//         const mainBanners = await MainBanners.find()
//         // checking if order already exist
//         const isOrderExist = mainBanners.length > 0 ? mainBanners.some(banner => banner.order === Number(order)) : false;
//         if (isOrderExist) {
//             return res.status(401).json({ error: 'Order number already exist' })
//         }

//         let bannerImage;

//         if (!file) {
//             return res.status(400).json({ success: false, message: 'Image is required' })
//         } else {
//             const sizes = [
//                 { width: 640, prefix: 'sm' },  // Small size for mobile view
//                 { width: 1024, prefix: 'md' }, // Medium size for tablet or smaller laptop view
//                 { width: 1519, prefix: 'lg' }, // Original size for desktop/laptop view
//             ];
//             const bucket = process.env.AWS_BUCKET_NAME_OTHER_IMAGES
//             const newFolder=path.parse(file.originalname.toLowerCase()).name
//             const key = `homepage-banners/${newFolder}`
//             // try {
//             //     bannerUrl = await uploadToS3(file, Bucket, Key)  // uploading image
//             // } catch (uploadError) {
//             //     throw new Error('Image upload failed: ' + uploadError.message);
//             // }
//              bannerImage = await processImage(sizes,bucket,key,file);;
//         }

//         // Create a new banner document
//         const newBanner = new MainBanners({
//             title,
//             description,
//             image: bannerImage,
//             redirectionUrl,
//             order
//         });

//         // Save the banner to the database
//         await newBanner.save();
//         res.status(201).json({
//             success: true,
//             message: 'Banner created successfully',
//             // banner: newBanner
//         });
//     } catch (err) {
//         console.log('err', err)
//         res.status(500).json({
//             success: false,
//             message: 'An error occurred while creating the banner',
//             error: err.message
//         });
//     }
// };

// exports.addNewBanner = async (req, res) => {
//     try {
//         const { title, description, redirectionUrl, order } = req.body;
//         // const file = req.file;

//         if (!redirectionUrl || !order) {
//             return res.status(400).json({ success: false, message: 'Redirectional Url is required' })
//         }

//         const mainBanners = await MainBanners.find()
//         // checking if order already exist
//         const isOrderExist = mainBanners.length > 0 ? mainBanners.some(banner => banner.order === Number(order)) : false;
//         if (isOrderExist) {
//             return res.status(401).json({ error: 'Order number already exist' })
//         }

//         if (!req.file) {
//             throw new AppError('No image file provided', 400);
//         }

//         // Log upload for monitoring

//         try {
//             // Upload buffer directly to Cloudinary
//             const result = await uploadToCloudinary(req.file.buffer, {
//                 folder: `ecommerce/${req.body.category || 'general'}`,
//                 public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`
//             });

//             // console.log(`Image uploaded: ${result.public_id} by user: ${req.user?.id || 'anonymous'}`);
//             console.log('image url: ', result.secure_url)


//             const newBanner = new MainBanners({
//                 title,
//                 description,
//                 image: result.secure_url,
//                 redirectionUrl,
//                 order
//             });

//             // Save the banner to the database
//             await newBanner.save();


//             res.status(201).json({
//                 success: true,
//                 message: 'Banner created successfully',
//                 // banner: newBanner
//             });

//             // res.status(201).json({
//             //     success: true,
//             //     data: {
//             //         url: result.secure_url,
//             //         publicId: result.public_id,
//             //         width: result.width,
//             //         height: result.height,
//             //         format: result.format,
//             //         bytes: result.bytes,
//             //         createdAt: new Date().toISOString()
//             //     }
//             // });
//         } catch (cloudinaryError) {
//             console.error('Cloudinary upload error:', cloudinaryError);
//             throw new AppError('Failed to upload image to Cloudinary', 500);
//         }



//         // Create a new banner document


//     } catch (err) {
//         res.status(500).json({
//             success: false,
//             message: 'An error occurred while creating the banner',
//             error: err.message
//         });
//     }
// };

// ====================== add new banner (new method) ===============================
exports.addNewBanner = async (req, res) => {
    try {
        const { title, description, redirectionUrl, order } = req.body;
        const file = req.file;

        if (!redirectionUrl || !order) {
            return res.status(400).json({ success: false, message: 'Redirectional Url is required' })
        }

        const mainBanners = await MainBanners.find()
        // checking if order already exist
        const isOrderExist = mainBanners.length > 0 ? mainBanners.some(banner => banner.order === Number(order)) : false;
        if (isOrderExist) {
            return res.status(401).json({ error: 'Order number already exist' })
        }

        let bannerImage;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Image is required' })
        } else {
            const bucket = process.env.AWS_BUCKET_NAME_OTHER_IMAGES
            const key = `live-homepage-banners`
            bannerImage = await uploadImgOnAWS(bucket, key, file);
        }
        // Create a new banner document
        const newBanner = new MainBanners({
            title,
            description,
            image: bannerImage,
            redirectionUrl,
            order
        });

        // Save the banner to the database
        await newBanner.save();
        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            // banner: newBanner
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the banner',
            error: err.message
        });
    }
};

// ============================== delete banner ===============================
exports.deleteBanner = async (req, res) => {
    try {
        const bannerId = req.params.bannerId;
        const banner = await MainBanners.findById(bannerId)

        if (!banner) {
            return res.status(404).json({ error: 'No Banner found' })
        }


        // Delete the banner
        await MainBanners.findByIdAndDelete(bannerId);

        // Respond with success
        return res.status(200).json({ message: 'Banner deleted successfully.' });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the banner',
            error: error.message
        });
    }
};




