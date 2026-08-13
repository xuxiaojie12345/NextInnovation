package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleSearchRecord {
    private String pc;
    private String num;
    private String market;
    private String vs;
    private String vs2;
    private String variable;
    private String val;
    private String comments;
    private String addDate;
    private String deleteDate;
    private String registerUser;
    private String registerDatetime;
}
