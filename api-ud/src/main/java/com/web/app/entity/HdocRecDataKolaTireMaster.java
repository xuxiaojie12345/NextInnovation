package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocRecDataKolaTireMaster {
    private String partno;
    private String tdim;
    private String brand;
    private String loadIndex;
    private String vpv;
    private String transTs;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
