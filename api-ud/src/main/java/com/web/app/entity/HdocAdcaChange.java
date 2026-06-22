package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocAdcaChange {
    private String serie;
    private String chnr;
    private String act;
    private String bu;
    private String reason;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
