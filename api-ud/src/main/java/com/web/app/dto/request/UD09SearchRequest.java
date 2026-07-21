package com.web.app.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class UD09SearchRequest {
    private String pc;
    private String num;
    private String market;
    private String variable;
    private String val;
    private String vs;
    private String vs2;
    private String comments;
    private String addDateFrom;
    private String addDateTo;
    private String deleteDateFrom;
    private String deleteDateTo;
    private String createdByUser;
}
