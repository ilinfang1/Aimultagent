package com.lin.aimultagent.service.impl;

import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.entity.FocusRecord;
import com.lin.aimultagent.repository.FocusRecordRepository;
import com.lin.aimultagent.service.RecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class RecordServiceImpl implements RecordService {

    @Autowired
    private FocusRecordRepository recordRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result addRecord(FocusRecord record) {
        if (record.getUserId() == null || record.getDurationMinutes() == null) {
            return Result.error("记录数据不完整");
        }
        recordRepository.save(record);
        return Result.success("记录保存成功");
    }

    @Override
    public Result getStats(Integer userId) {
        Map<String, Object> statsData = new HashMap<>();
        // 获取最近的 10 条记录，用于前端显示时间轴
        statsData.put("recentRecords", recordRepository.findTop10ByUserIdOrderByCreateTimeDesc(userId));
        // 获取按日期分组的专注时长，用于前端渲染热力图
        statsData.put("heatmapData", recordRepository.getDailyFocusStats(userId));

        return Result.success(statsData);
    }
}