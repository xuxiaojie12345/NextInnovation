package com.web.app.test;

import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import com.web.app.mapper.UD08HomologationVariablesMapper;
import com.web.app.service.impl.UD08HomologationVariablesServiceImpl;
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
@DisplayName("UD08HomologationVariablesServiceImpl Unit Tests")
class UD08HomologationVariablesServiceImplTest {

    @Mock private UD08HomologationVariablesMapper mapper;
    @InjectMocks private UD08HomologationVariablesServiceImpl service;

    @Nested @DisplayName("selectProductClassMaster()")
    class SelectProductClass {
        @Test void shouldReturnList() {
            when(mapper.selectProductClassMaster()).thenReturn(Arrays.asList(new ProductClassMaster()));
            assertEquals(1, service.selectProductClassMaster().size());
        }
    }

    @Nested @DisplayName("selectMarketMaster()")
    class SelectMarket {
        @Test void shouldReturnList() {
            when(mapper.selectMarketMaster()).thenReturn(Arrays.asList(new MarketMaster()));
            assertEquals(1, service.selectMarketMaster().size());
        }
    }

    @Nested @DisplayName("checkVariable()")
    class CheckVariable {
        @Test void shouldReturnTrueWhenExists() {
            when(mapper.countVariable("VAR")).thenReturn(1);
            assertTrue(service.checkVariable("VAR"));
        }
        @Test void shouldReturnFalseWhenNotExists() {
            when(mapper.countVariable("VAR")).thenReturn(0);
            assertFalse(service.checkVariable("VAR"));
        }
    }

    @Nested @DisplayName("checkRule()")
    class CheckRule {
        @Test void shouldReturnTrueWhenExists() {
            when(mapper.countDefinedRules("PC1", "001", "JP")).thenReturn(1);
            assertTrue(service.checkRule("PC1", "001", "JP"));
        }
        @Test void shouldReturnFalseWhenNotExists() {
            when(mapper.countDefinedRules("PC1", "001", "JP")).thenReturn(0);
            assertFalse(service.checkRule("PC1", "001", "JP"));
        }
    }

    @Nested @DisplayName("addRule/updateRule/deleteRule/deleteSelectedRules/searchRules")
    class Rules {
        @Test void shouldAddRule() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            rule.setNum("001");
            rule.setMarket("JP");
            rule.setRegisterUser("user1");
            rule.setUpdateUser("user1");
            when(mapper.insertRule(any())).thenReturn(1);
            assertEquals(1, service.addRule(rule));
        }

        @Test void shouldAddRuleWithNullRegisterUser() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            rule.setNum("001");
            rule.setMarket("JP");
            rule.setRegisterUser(null);
            rule.setUpdateUser("user1");
            when(mapper.insertRule(any())).thenReturn(1);
            assertEquals(1, service.addRule(rule));
            assertEquals("SYSTEM", rule.getRegisterUser());
        }

        @Test void shouldAddRuleWithEmptyRegisterUser() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            rule.setNum("001");
            rule.setMarket("JP");
            rule.setRegisterUser("");
            rule.setUpdateUser("user1");
            when(mapper.insertRule(any())).thenReturn(1);
            assertEquals(1, service.addRule(rule));
            assertEquals("SYSTEM", rule.getRegisterUser());
        }

        @Test void shouldAddRuleWithNullUpdateUser() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            rule.setNum("001");
            rule.setMarket("JP");
            rule.setRegisterUser("user1");
            rule.setUpdateUser(null);
            when(mapper.insertRule(any())).thenReturn(1);
            assertEquals(1, service.addRule(rule));
            assertEquals("SYSTEM", rule.getUpdateUser());
        }

        @Test void shouldAddRuleWithEmptyUpdateUser() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            rule.setNum("001");
            rule.setMarket("JP");
            rule.setRegisterUser("user1");
            rule.setUpdateUser("");
            when(mapper.insertRule(any())).thenReturn(1);
            assertEquals(1, service.addRule(rule));
            assertEquals("SYSTEM", rule.getUpdateUser());
        }

        @Test void shouldUpdateRule() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setUpdateUser("user1");
            when(mapper.updateRule(any())).thenReturn(2);
            assertEquals(2, service.updateRule(rule));
        }

        @Test void shouldUpdateRuleWithNullUpdateUser() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setUpdateUser(null);
            when(mapper.updateRule(any())).thenReturn(2);
            assertEquals(2, service.updateRule(rule));
            assertEquals("SYSTEM", rule.getUpdateUser());
        }

        @Test void shouldUpdateRuleWithEmptyUpdateUser() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setUpdateUser("");
            when(mapper.updateRule(any())).thenReturn(2);
            assertEquals(2, service.updateRule(rule));
            assertEquals("SYSTEM", rule.getUpdateUser());
        }

        @Test void shouldDeleteRule() {
            when(mapper.deleteRule("PC1", "001", "JP")).thenReturn(1);
            assertEquals(1, service.deleteRule("PC1", "001", "JP"));
        }

        @SuppressWarnings("unchecked")
        @Test void shouldDeleteSelectedRules() {
            List<Map<String, Object>> rules = new ArrayList<>();
            Map<String, Object> rule = new HashMap<>();
            rule.put("pc", "PC1");
            rule.put("num", "001");
            rule.put("market", "JP");
            rules.add(rule);
            when(mapper.deleteSelectedRules(any(List.class))).thenReturn(1);
            assertEquals(1, service.deleteSelectedRules(rules));
        }

        @Test void shouldSearchRules() {
            when(mapper.searchRules(any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any())).thenReturn(new ArrayList<>());
            assertNotNull(service.searchRules(null, null, null, null, null,
                null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null));
        }
    }
}
