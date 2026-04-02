package com.lin.aimultagent.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "cloud_archive")
public class CloudArchive {

    // 使用 userId 作为主键，保证一个用户只有一份云端存档
    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId; // 如果你的 User 表主键是 Integer，这里改成 Integer 也行

    @Column(name = "focus_crystals")
    private Integer focusCrystals;

    @Column(name = "base_level")
    private Integer baseLevel;

    // 用 columnDefinition = "TEXT" 告诉 JPA 这是一个长文本字段，用来存 JSON
    @Column(name = "stats_json", columnDefinition = "TEXT")
    private String statsJson;

    @Column(name = "badges_json", columnDefinition = "TEXT")
    private String badgesJson;

    @Column(name = "quests_json", columnDefinition = "TEXT")
    private String questsJson;
}