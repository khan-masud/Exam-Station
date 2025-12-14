import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// GET - Fetch images
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (imageId) {
      const [images] = await pool.query(
        `SELECT * FROM landing_images WHERE id = ?`,
        [imageId]
      ) as any

      if (!images || images.length === 0) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 })
      }

      const image = images[0]
      return NextResponse.json({
        image: {
          ...image,
          used_in_sections: image.used_in_sections ? 
            (typeof image.used_in_sections === 'string' ? JSON.parse(image.used_in_sections) : image.used_in_sections) : [],
        }
      })
    }

    // Get all images with pagination
    const [images] = await pool.query(
      `SELECT * FROM landing_images ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM landing_images`
    ) as any

    const parsedImages = images.map((image: any) => ({
      ...image,
      used_in_sections: image.used_in_sections ? 
        (typeof image.used_in_sections === 'string' ? JSON.parse(image.used_in_sections) : image.used_in_sections) : [],
    }))

    return NextResponse.json({ 
      images: parsedImages,
      total: countResult[0].total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Get images error:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

// POST - Upload image
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can upload images' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const altText = formData.get('altText') as string
    const caption = formData.get('caption') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, SVG' 
      }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'landing')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const fileName = `${uuidv4()}${fileExtension}`
    const filePath = path.join(uploadDir, fileName)
    const fileUrl = `/uploads/landing/${fileName}`

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Get image dimensions (for basic image types)
    let width = null
    let height = null
    
    // For SVG, we can't easily get dimensions without a library
    // For other formats, you might want to use a library like 'sharp' or 'image-size'
    // For now, we'll leave them as null and can be updated later

    const imageId = uuidv4()

    // Save to database
    await pool.query(
      `INSERT INTO landing_images (
        id, file_name, file_path, file_url, file_size, mime_type,
        width, height, alt_text, caption, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        imageId, fileName, filePath, fileUrl, file.size, file.type,
        width, height, altText, caption, decoded.userId
      ]
    )

    return NextResponse.json({ 
      message: 'Image uploaded successfully',
      image: {
        id: imageId,
        fileName,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        altText,
        caption
      }
    })
  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

// DELETE - Delete image
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete images' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('id')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    // Get image details
    const [images] = await pool.query(
      `SELECT file_path, usage_count FROM landing_images WHERE id = ?`,
      [imageId]
    ) as any

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const image = images[0]

    // Check if image is being used
    if (image.usage_count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete image that is currently in use. Please remove it from sections first.' 
      }, { status: 400 })
    }

    // Delete file from filesystem
    try {
      const fs = require('fs').promises
      if (existsSync(image.file_path)) {
        await fs.unlink(image.file_path)
      }
    } catch (error) {
      console.error('Failed to delete file from filesystem:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await pool.query(`DELETE FROM landing_images WHERE id = ?`, [imageId])

    return NextResponse.json({ message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Delete image error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
