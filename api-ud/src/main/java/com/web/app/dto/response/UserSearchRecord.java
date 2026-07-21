package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchRecord {
    private String userId;
    private String userName;
    private String market;
    private Integer totalCount;
}
