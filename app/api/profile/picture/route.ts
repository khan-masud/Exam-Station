import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${decoded.userId}-${timestamp}.jpg`
    const filepath = join(uploadsDir, filename)

    // Process image with sharp (resize and optimize)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(filepath)

    // Update user profile picture in database
    const profilePictureUrl = `/uploads/profiles/${filename}`
    await pool.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profilePictureUrl, decoded.userId]
    )

    return NextResponse.json({ 
      success: true,
      profilePicture: profilePictureUrl,
      message: 'Profile picture updated successfully'
    })
  } catch (error) {
    console.error('Upload profile picture error:', error)
    return NextResponse.json({ error: 'Failed to upload profile picture' }, { status: 500 })
  }
}

// Delete profile picture
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Update database to remove profile picture
    await pool.query(
      'UPDATE users SET profile_picture = NULL WHERE id = ?',
      [decoded.userId]
    )

    return NextResponse.json({ 
      success: true,
      message: 'Profile picture removed successfully'
    })
  } catch (error) {
    console.error('Delete profile picture error:', error)
    return NextResponse.json({ error: 'Failed to delete profile picture' }, { status: 500 })
  }
}
