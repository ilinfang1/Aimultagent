package com.lin.aimultagent.entity;

import jakarta.persistence.*;

/**
 * 玩家游戏存档实体类
 */
@Entity
@Table(name = "player_save")
public class PlayerSave {

    @Id
    private Integer id; // 固定为 1 (单机版)

    @Column(name = "focus_crystals")
    private Integer focusCrystals;

    @Column(name = "base_level")
    private Integer baseLevel;

    @Column(name = "linxia_affection")
    private Integer linxiaAffection;

    @Column(name = "suwan_affection")
    private Integer suwanAffection;

    // --- Getters and Setters ---
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getFocusCrystals() {
        return focusCrystals;
    }

    public void setFocusCrystals(Integer focusCrystals) {
        this.focusCrystals = focusCrystals;
    }

    public Integer getBaseLevel() {
        return baseLevel;
    }

    public void setBaseLevel(Integer baseLevel) {
        this.baseLevel = baseLevel;
    }

    public Integer getLinxiaAffection() {
        return linxiaAffection;
    }

    public void setLinxiaAffection(Integer linxiaAffection) {
        this.linxiaAffection = linxiaAffection;
    }

    public Integer getSuwanAffection() {
        return suwanAffection;
    }

    public void setSuwanAffection(Integer suwanAffection) {
        this.suwanAffection = suwanAffection;
    }
}