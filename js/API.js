/**
 * Leaderboard - Supabase 远程排行榜
 * 提交分数到 Supabase，获取全服 Top 20
 */

const SUPABASE_URL = 'https://hkeaguwnkjbxwqazjxbd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZWFndXdua2pieHdxYXpqeGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzOTQzNTAsImV4cCI6MjA5ODk3MDM1MH0.AcposSh94v8nHfiFZLjRiqVGLIR7CiYDxfZkXPY7w9Y';

class Leaderboard {
  constructor() {
    this.maxEntries = 20;
  }

  /** 提交分数到 Supabase */
  async submitScore(nickname, score) {
    const name = String(nickname).trim().slice(0, 12);
    if (!name) return false;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ nickname: name, score }),
      });
      return res.ok;
    } catch (e) {
      console.warn('提交分数失败:', e.message);
      return false;
    }
  }

  /** 获取 Top 20 排行榜 */
  async getRankings() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=*&order=score.desc&limit=${this.maxEntries}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const data = await res.json();
      return {
        rankings: data.map((e, i) => ({ ...e, rank: i + 1 })),
        total: data.length,
      };
    } catch (e) {
      console.warn('获取排行榜失败:', e.message);
      return { rankings: [], total: 0 };
    }
  }

  /** 获取排名（保留兼容） */
  async getFormattedRankings() {
    return await this.getRankings();
  }

  /** 查询某个分数在排行榜上的排名 */
  async getRank(score) {
    try {
      // 统计比当前分数高的记录数
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/scores?select=score&score=gt.${score}`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const higher = await res.json();
      return higher.length + 1;
    } catch (e) {
      console.warn('查询排名失败:', e.message);
      return null;
    }
  }
}