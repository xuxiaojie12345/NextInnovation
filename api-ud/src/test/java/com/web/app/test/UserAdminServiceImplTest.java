package com.web.app.test;

import com.web.app.mapper.UserAdminMapper;
import com.web.app.service.impl.UserAdminServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserAdminServiceImpl Unit Tests")
class UserAdminServiceImplTest {

    @Mock private UserAdminMapper userAdminMapper;
    @InjectMocks private UserAdminServiceImpl service;

    @Nested @DisplayName("getUserAuthList()")
    class GetUserAuthList {
        @Test void shouldReturnAuthList() {
            List<Map<String, Object>> authRecords = new ArrayList<>();
            Map<String, Object> record = new HashMap<>();
            record.put("USERID", "user1");
            record.put("USERNAME", "User One");
            record.put("PASSWORD", "pass");
            record.put("FUNCTION", "RULES");
            record.put("MARKET", "JP");
            authRecords.add(record);
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("USERPOSITION", "Admin");
            userInfo.put("EMAIL", "u@t.com");
            when(userAdminMapper.selectUserAuth("user1")).thenReturn(authRecords);
            when(userAdminMapper.selectUserInfo("user1")).thenReturn(userInfo);

            Map<String, Object> result = service.getUserAuthList("user1");
            assertEquals("user1", result.get("userId"));
            assertEquals("User One", result.get("username"));
        }

        @Test void shouldReturnEmptyWhenNoRecords() {
            when(userAdminMapper.selectUserAuth("user1")).thenReturn(new ArrayList<>());
            when(userAdminMapper.selectUserInfo("user1")).thenReturn(null);
            Map<String, Object> result = service.getUserAuthList("user1");
            assertEquals("user1", result.get("userId"));
            assertEquals("", result.get("username"));
            assertTrue(((List<?>) result.get("authList")).isEmpty());
        }

        @Test void shouldReturnEmptyWhenAuthRecordsNull() {
            when(userAdminMapper.selectUserAuth("user1")).thenReturn(null);
            when(userAdminMapper.selectUserInfo("user1")).thenReturn(null);
            Map<String, Object> result = service.getUserAuthList("user1");
            assertEquals("user1", result.get("userId"));
            assertEquals("", result.get("username"));
            assertTrue(((List<?>) result.get("authList")).isEmpty());
        }
    }

    @Nested @DisplayName("updateUserRole()")
    class UpdateUserRole {
        @Test void shouldUpdateRole() {
            List<Map<String, String>> authList = new ArrayList<>();
            Map<String, String> auth = new HashMap<>();
            auth.put("function", "RULES");
            auth.put("market", "JP");
            authList.add(auth);
            when(userAdminMapper.insertFunctionAuth(anyString(), anyString(), anyString())).thenReturn(1);
            when(userAdminMapper.insertMarketAuth(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
            int count = service.updateUserRole("user1", authList, "admin");
            verify(userAdminMapper).deleteFunctionAuth("user1");
            verify(userAdminMapper).deleteMarketAuth("user1");
            assertTrue(count > 0);
        }

        @Test void shouldUpdateRoleWithMultipleFunctions() {
            List<Map<String, String>> authList = new ArrayList<>();
            for (String func : new String[]{"User Administrator", "RULES", "TEMPLATE", "USER", "Document", "ADAPTATION DOC", "market super user"}) {
                Map<String, String> auth = new HashMap<>();
                auth.put("function", func);
                auth.put("market", "JP");
                authList.add(auth);
            }
            when(userAdminMapper.insertFunctionAuth(anyString(), anyString(), anyString())).thenReturn(1);
            when(userAdminMapper.insertMarketAuth(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
            int count = service.updateUserRole("user1", authList, "admin");
            assertTrue(count > 0);
        }

        @Test void shouldHandleEmptyAuthList() {
            int count = service.updateUserRole("user1", new ArrayList<>(), "admin");
            verify(userAdminMapper).deleteFunctionAuth("user1");
            verify(userAdminMapper).deleteMarketAuth("user1");
            assertEquals(0, count);
        }

        @Test void shouldUseSystemUserWhenCurrentUserNull() {
            List<Map<String, String>> authList = new ArrayList<>();
            Map<String, String> auth = new HashMap<>();
            auth.put("function", "RULES");
            auth.put("market", "JP");
            authList.add(auth);
            when(userAdminMapper.insertFunctionAuth(anyString(), anyString(), eq("SYSTEM"))).thenReturn(1);
            when(userAdminMapper.insertMarketAuth(anyString(), anyString(), anyString(), eq("SYSTEM"))).thenReturn(1);
            int count = service.updateUserRole("user1", authList, null);
            assertEquals(1, count);
        }

        @Test void shouldUseSystemUserWhenCurrentUserEmpty() {
            List<Map<String, String>> authList = new ArrayList<>();
            Map<String, String> auth = new HashMap<>();
            auth.put("function", "RULES");
            auth.put("market", "JP");
            authList.add(auth);
            when(userAdminMapper.insertFunctionAuth(anyString(), anyString(), eq("SYSTEM"))).thenReturn(1);
            when(userAdminMapper.insertMarketAuth(anyString(), anyString(), anyString(), eq("SYSTEM"))).thenReturn(1);
            int count = service.updateUserRole("user1", authList, "");
            assertEquals(1, count);
        }

        @Test void shouldHandleNullMarket() {
            List<Map<String, String>> authList = new ArrayList<>();
            Map<String, String> auth = new HashMap<>();
            auth.put("function", "RULES");
            auth.put("market", null);
            authList.add(auth);
            when(userAdminMapper.insertFunctionAuth(anyString(), anyString(), anyString())).thenReturn(1);
            int count = service.updateUserRole("user1", authList, "admin");
            assertEquals(1, count);
            verify(userAdminMapper, never()).insertMarketAuth(anyString(), anyString(), anyString(), anyString());
        }

        @Test void shouldHandleEmptyMarket() {
            List<Map<String, String>> authList = new ArrayList<>();
            Map<String, String> auth = new HashMap<>();
            auth.put("function", "RULES");
            auth.put("market", "");
            authList.add(auth);
            when(userAdminMapper.insertFunctionAuth(anyString(), anyString(), anyString())).thenReturn(1);
            int count = service.updateUserRole("user1", authList, "admin");
            assertEquals(1, count);
            verify(userAdminMapper, never()).insertMarketAuth(anyString(), anyString(), anyString(), anyString());
        }

        @Test void shouldHandleDefaultFunctionInTypeMapping() {
            List<Map<String, String>> authList = new ArrayList<>();
            Map<String, String> auth = new HashMap<>();
            auth.put("function", "UNKNOWN_FUNC");
            auth.put("market", "JP");
            authList.add(auth);
            when(userAdminMapper.insertFunctionAuth(anyString(), anyString(), anyString())).thenReturn(1);
            when(userAdminMapper.insertMarketAuth(anyString(), anyString(), anyString(), anyString())).thenReturn(1);
            int count = service.updateUserRole("user1", authList, "admin");
            assertEquals(1, count);
        }
    }

    @Nested @DisplayName("deleteUserRole()")
    class DeleteUserRole {
        @Test void shouldDeleteRole() {
            service.deleteUserRole("user1");
            verify(userAdminMapper).deleteFunctionAuth("user1");
            verify(userAdminMapper).deleteMarketAuth("user1");
        }
    }
}
