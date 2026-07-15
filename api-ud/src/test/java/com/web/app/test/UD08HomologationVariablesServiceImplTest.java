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

    @Nested @DisplayName("addRule/updateRule/deleteRule")
    class Rules {
        @Test void shouldAddRule() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            rule.setNum("001");
            rule.setMarket("JP");
            when(mapper.insertRule(any())).thenReturn(1);
            assertEquals(1, service.addRule(rule));
        }
        @Test void shouldUpdateRule() {
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            when(mapper.updateRule(any())).thenReturn(2);
            assertEquals(2, service.updateRule(rule));
        }
        @Test void shouldDeleteRule() {
            when(mapper.deleteRule("PC1", "001", "JP")).thenReturn(1);
            assertEquals(1, service.deleteRule("PC1", "001", "JP"));
        }
    }
}
