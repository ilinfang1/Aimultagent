package com.lin.aimultagent.service;

import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.entity.FocusRecord;

public interface RecordService {
    // 添加一条专注记录
    Result addRecord(FocusRecord record);

    // 获取数据看板统计信息
    Result getStats(Integer userId);
}