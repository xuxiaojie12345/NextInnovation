package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocRecDataKolaTireMaster {
    private String partno;
    private String tdim;
    private String brand;
    private String loadIndex;
    private String vpv;
    private String transTs;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
