import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    const studentId = decoded.userId

    // Get student stats for achievements
    const [stats] = await query(`
      SELECT 
        COUNT(DISTINCT er.exam_id) as total_exams,
        SUM(CASE WHEN er.status = 'pass' THEN 1 ELSE 0 END) as passed_exams,
        MAX(er.percentage) as highest_score,
        AVG(er.percentage) as avg_score,
        COUNT(DISTINCT DATE(er.result_date)) as study_days,
        DATEDIFF(NOW(), MIN(er.result_date)) as days_since_first_exam
      FROM exam_results er
      WHERE er.student_id = ?
    `, [studentId]) as any[]

    const totalExams = stats?.total_exams || 0
    const passedExams = stats?.passed_exams || 0
    const highestScore = stats?.highest_score || 0
    const avgScore = stats?.avg_score || 0
    const studyDays = stats?.study_days || 0

    // Get count of exams with 95%+ score
    const [highScoreData] = await query(`
      SELECT COUNT(*) as high_score_count
      FROM exam_results
      WHERE student_id = ? AND percentage >= 95
    `, [studentId]) as any[]

    const highScoreCount = highScoreData?.high_score_count || 0

    // Get consecutive days streak
    const [streakData] = await query(`
      SELECT 
        result_date,
        DATE(result_date) as exam_date
      FROM exam_results
      WHERE student_id = ?
      ORDER BY result_date DESC
    `, [studentId]) as any[]

    let currentStreak = 0
    if (streakData && streakData.length > 0) {
      const dates = streakData.map((d: any) => new Date(d.exam_date))
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < dates.length; i++) {
        const examDate = new Date(dates[i])
        examDate.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((today.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === i) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Define achievements based on actual data
    const achievements = [
      {
        id: '1',
        title: 'First Steps',
        description: 'Complete your first exam',
        icon: '🎯',
        category: 'exams' as const,
        isUnlocked: totalExams >= 1,
        unlockedAt: totalExams >= 1 ? new Date().toISOString() : null,
        progress: Math.min(totalExams, 1),
        total: 1
      },
      {
        id: '2',
        title: 'Perfect Score',
        description: 'Score 100% in an exam',
        icon: '💯',
        category: 'performance' as const,
        isUnlocked: highestScore >= 100,
        unlockedAt: highestScore >= 100 ? new Date().toISOString() : null,
        progress: Math.min(highestScore, 100),
        total: 100
      },
      {
        id: '3',
        title: 'Exam Warrior',
        description: 'Complete 10 exams',
        icon: '⚔️',
        category: 'exams' as const,
        isUnlocked: totalExams >= 10,
        unlockedAt: totalExams >= 10 ? new Date().toISOString() : null,
        progress: Math.min(totalExams, 10),
        total: 10
      },
      {
        id: '4',
        title: 'Excellence',
        description: 'Maintain 90%+ average score',
        icon: '🌟',
        category: 'performance' as const,
        isUnlocked: avgScore >= 90,
        unlockedAt: avgScore >= 90 ? new Date().toISOString() : null,
        progress: Math.min(Math.round(avgScore), 90),
        total: 90
      },
      {
        id: '5',
        title: 'Dedicated Learner',
        description: 'Study for 7 consecutive days',
        icon: '📚',
        category: 'study' as const,
        isUnlocked: currentStreak >= 7,
        unlockedAt: currentStreak >= 7 ? new Date().toISOString() : null,
        progress: Math.min(currentStreak, 7),
        total: 7
      },
      {
        id: '6',
        title: 'Pass Master',
        description: 'Pass 20 exams',
        icon: '✅',
        category: 'exams' as const,
        isUnlocked: passedExams >= 20,
        unlockedAt: passedExams >= 20 ? new Date().toISOString() : null,
        progress: Math.min(passedExams, 20),
        total: 20
      },
      {
        id: '7',
        title: 'High Achiever',
        description: 'Score 95%+ in 5 exams',
        icon: '🏆',
        category: 'performance' as const,
        isUnlocked: highScoreCount >= 5,
        unlockedAt: highScoreCount >= 5 ? new Date().toISOString() : null,
        progress: Math.min(highScoreCount, 5),
        total: 5
      },
      {
        id: '8',
        title: 'Marathon Runner',
        description: 'Complete 30 days study streak',
        icon: '🔥',
        category: 'study' as const,
        isUnlocked: currentStreak >= 30,
        unlockedAt: currentStreak >= 30 ? new Date().toISOString() : null,
        progress: Math.min(currentStreak, 30),
        total: 30
      }
    ]

    const stats_summary = {
      totalAchievements: achievements.length,
      unlockedAchievements: achievements.filter(a => a.isUnlocked).length,
      examAchievements: achievements.filter(a => a.category === 'exams' && a.isUnlocked).length,
      performanceAchievements: achievements.filter(a => a.category === 'performance' && a.isUnlocked).length,
      studyAchievements: achievements.filter(a => a.category === 'study' && a.isUnlocked).length,
      currentStreak: currentStreak,
      totalExams: totalExams,
      passedExams: passedExams,
      averageScore: Math.round(avgScore * 10) / 10
    }

    return NextResponse.json({
      achievements,
      stats: stats_summary
    })
  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
  }
}
