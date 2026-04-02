package com.lin.aimultagent.repository;

import com.lin.aimultagent.entity.FocusRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface FocusRecordRepository extends JpaRepository<FocusRecord, Integer> {

    // 获取某个用户最近的专注记录
    List<FocusRecord> findTop10ByUserIdOrderByCreateTimeDesc(Integer userId);

    // 🌟 核心：按日期分组，统计每天的总专注分钟数（用于生成热力图）
    // 返回格式类似: [{"date": "2026-03-31", "totalMinutes": 45}, ...]
    @Query(value = "SELECT DATE(create_time) as date, SUM(duration_minutes) as totalMinutes " +
            "FROM focus_record WHERE user_id = :userId GROUP BY DATE(create_time) " +
            "ORDER BY date DESC LIMIT 30", nativeQuery = true)
    List<Map<String, Object>> getDailyFocusStats(@Param("userId") Integer userId);
}