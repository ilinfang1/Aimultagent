package com.lin.aimultagent.controller;

import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.entity.FocusRecord;
import com.lin.aimultagent.service.RecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/record")
@CrossOrigin(origins = "*")
public class RecordController {

    @Autowired
    private RecordService recordService; // 注入大脑

    @PostMapping("/add")
    public Result addRecord(@RequestBody FocusRecord record) {
        return recordService.addRecord(record);
    }

    @GetMapping("/stats")
    public Result getStats(@RequestParam Integer userId) {
        return recordService.getStats(userId);
    }
}