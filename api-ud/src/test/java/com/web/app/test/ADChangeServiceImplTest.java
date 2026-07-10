package com.web.app.test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.web.app.entity.HdocAdcaChange;
import com.web.app.mapper.ADChangeMapper;
import com.web.app.service.impl.ADChangeServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * ADChangeServiceImpl 的单元测试，覆盖所有分支（100% 覆盖率）。
 *
 * <p>测试策略： - {@link ADChangeServiceImpl#findBySerieAndChnr(String, String)}： Mapper 返回实体 / 返回 null
 * - {@link ADChangeServiceImpl#insert(String, String, String, String, String, String)}： Mapper 返回 1（插入成功）/
 * 返回 0（插入失败） - {@link ADChangeServiceImpl#updateAllActToN(String)}： Mapper 返回任意 int
 */
@ExtendWith(MockitoExtension.class)
class ADChangeServiceImplTest {

  @Mock private ADChangeMapper adChangeMapper;

  @InjectMocks private ADChangeServiceImpl adChangeService;

  private static final String SERIE = "FH";
  private static final String CHNR = "12345";
  private static final String ACT = "Y";
  private static final String BU = "UD";
  private static final String REASON = "test reason";
  private static final String UPDATE_USER = "testUser";

  // ================================================================
  //  findBySerieAndChnr
  // ================================================================

  @Nested
  @DisplayName("findBySerieAndChnr 方法")
  class FindBySerieAndChnrTest {

    @Test
    @DisplayName("Mapper 返回实体对象 → 应返回该实体")
    void shouldReturnEntityWhenMapperReturnsEntity() {
      // Arrange
      HdocAdcaChange expected = new HdocAdcaChange();
      expected.setSerie(SERIE);
      expected.setChnr(CHNR);
      expected.setAct(ACT);
      when(adChangeMapper.findBySerieAndChnr(SERIE, CHNR)).thenReturn(expected);

      // Act
      HdocAdcaChange actual = adChangeService.findBySerieAndChnr(SERIE, CHNR);

      // Assert
      assertNotNull(actual);
      assertSame(expected, actual);
      assertEquals(SERIE, actual.getSerie());
      assertEquals(CHNR, actual.getChnr());
      assertEquals(ACT, actual.getAct());
      verify(adChangeMapper).findBySerieAndChnr(SERIE, CHNR);
    }

    @Test
    @DisplayName("Mapper 返回 null → 应返回 null")
    void shouldReturnNullWhenMapperReturnsNull() {
      // Arrange
      when(adChangeMapper.findBySerieAndChnr(SERIE, CHNR)).thenReturn(null);

      // Act
      HdocAdcaChange actual = adChangeService.findBySerieAndChnr(SERIE, CHNR);

      // Assert
      assertNull(actual);
      verify(adChangeMapper).findBySerieAndChnr(SERIE, CHNR);
    }
  }

  // ================================================================
  //  insert
  // ================================================================

  @Nested
  @DisplayName("insert 方法")
  class InsertTest {

    @Test
    @DisplayName("Mapper 返回 1（插入成功）→ 应返回 1")
    void shouldReturn1WhenInsertSucceeds() {
      // Arrange
      when(adChangeMapper.insert(SERIE, CHNR, ACT, BU, REASON, UPDATE_USER)).thenReturn(1);

      // Act
      int result = adChangeService.insert(SERIE, CHNR, ACT, BU, REASON, UPDATE_USER);

      // Assert
      assertEquals(1, result);
      verify(adChangeMapper).insert(SERIE, CHNR, ACT, BU, REASON, UPDATE_USER);
    }

    @Test
    @DisplayName("Mapper 返回 0（插入失败）→ 应返回 0")
    void shouldReturn0WhenInsertFails() {
      // Arrange
      when(adChangeMapper.insert(SERIE, CHNR, ACT, BU, REASON, UPDATE_USER)).thenReturn(0);

      // Act
      int result = adChangeService.insert(SERIE, CHNR, ACT, BU, REASON, UPDATE_USER);

      // Assert
      assertEquals(0, result);
      verify(adChangeMapper).insert(SERIE, CHNR, ACT, BU, REASON, UPDATE_USER);
    }

    @Test
    @DisplayName("reason 为 null 时也能正常调用")
    void shouldAcceptNullReason() {
      // Arrange
      when(adChangeMapper.insert(SERIE, CHNR, ACT, BU, null, UPDATE_USER)).thenReturn(1);

      // Act
      int result = adChangeService.insert(SERIE, CHNR, ACT, BU, null, UPDATE_USER);

      // Assert
      assertEquals(1, result);
      verify(adChangeMapper).insert(SERIE, CHNR, ACT, BU, null, UPDATE_USER);
    }

    @Test
    @DisplayName("serie 为 null 时也能正常调用")
    void shouldAcceptNullSerie() {
      // Arrange
      when(adChangeMapper.insert(null, CHNR, ACT, BU, REASON, UPDATE_USER)).thenReturn(1);

      // Act
      int result = adChangeService.insert(null, CHNR, ACT, BU, REASON, UPDATE_USER);

      // Assert
      assertEquals(1, result);
      verify(adChangeMapper).insert(null, CHNR, ACT, BU, REASON, UPDATE_USER);
    }

    @Test
    @DisplayName("chnr 为 null 时也能正常调用")
    void shouldAcceptNullChnr() {
      // Arrange
      when(adChangeMapper.insert(SERIE, null, ACT, BU, REASON, UPDATE_USER)).thenReturn(1);

      // Act
      int result = adChangeService.insert(SERIE, null, ACT, BU, REASON, UPDATE_USER);

      // Assert
      assertEquals(1, result);
      verify(adChangeMapper).insert(SERIE, null, ACT, BU, REASON, UPDATE_USER);
    }
  }

  // ================================================================
  //  updateAllActToN
  // ================================================================

  @Nested
  @DisplayName("updateAllActToN 方法")
  class UpdateAllActToNTest {

    @Test
    @DisplayName("Mapper 返回更新的记录数（>0）→ 应返回该数字")
    void shouldReturnUpdateCountWhenGreaterThanZero() {
      // Arrange
      when(adChangeMapper.updateAllActToN(UPDATE_USER)).thenReturn(5);

      // Act
      int result = adChangeService.updateAllActToN(UPDATE_USER);

      // Assert
      assertEquals(5, result);
      verify(adChangeMapper).updateAllActToN(UPDATE_USER);
    }

    @Test
    @DisplayName("Mapper 返回 0（无记录更新）→ 应返回 0")
    void shouldReturnZeroWhenNoRecordsUpdated() {
      // Arrange
      when(adChangeMapper.updateAllActToN(UPDATE_USER)).thenReturn(0);

      // Act
      int result = adChangeService.updateAllActToN(UPDATE_USER);

      // Assert
      assertEquals(0, result);
      verify(adChangeMapper).updateAllActToN(UPDATE_USER);
    }
  }
}
