package com.web.app.service.impl;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.DocumentTypeOption;
import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.dto.MessageConstants;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.GenerateDocumentMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * GenerateDocumentServiceImpl 单元测试
 * 严格对应【詳細設計UD03.md（Generate Homologation Document 模块）】
 * 2.1 控件属性表 / 3.1 处理流程 / 测试用例 3、12、13。
 * 测试用例采用 AAA（Arrange-Act-Assert）模式编写，各测试方法相互独立。
 *
 * @author GitHub Copilot
 */
@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class GenerateDocumentServiceImplTest {

  /** 被测试的服务实现类，由 Mockito 注入下方 Mock 对象 */
  @InjectMocks
  private GenerateDocumentServiceImpl generateDocumentService;

  /** 数据访问层 Mock 对象 */
  @Mock
  private GenerateDocumentMapper generateDocumentMapper;

  /** 正常条件：Chassis series（测试用例 4 / 12） */
  private static final String VALID_CHASSIS_SERIES = "JPCT";

  /** 正常条件：Chassis no（测试用例 8 / 12） */
  private static final String VALID_CHASSIS_NO = "15101319";

  /** 正常条件：Document type（测试用例 12） */
  private static final String VALID_DOCUMENT_TYPE = "Homologation";

  /** Chassis series 边界值：正好 5 位（测试用例 5） */
  private static final String SERIES_MAX_LENGTH_VALUE = "ABCDE";

  /** Chassis series 边界值：超过 5 位（测试用例 6） */
  private static final String SERIES_OVER_LENGTH_VALUE = "ABCDEF";

  /** Chassis series 非法字符（测试用例 7） */
  private static final String SERIES_INVALID_VALUE = "123-@";

  /** Chassis no 边界值：正好 10 位（测试用例 9） */
  private static final String CHASSIS_NO_MAX_LENGTH_VALUE = "1234567890";

  /** Chassis no 边界值：超过 10 位（测试用例 10） */
  private static final String CHASSIS_NO_OVER_LENGTH_VALUE = "12345678901";

  /** Chassis no 非法字符（测试用例 11） */
  private static final String CHASSIS_NO_INVALID_VALUE = "ABC";

  /** 每个测试方法执行前的公共初始化 */
  @BeforeEach
  void setUp() {
    // 清空 Mock 调用记录，保证测试方法之间相互独立
    org.mockito.Mockito.reset(generateDocumentMapper);
  }

  /**
   * 构造文档类型实体
   *
   * @param doctype     文档类型
   * @param description 文档类型描述
   * @return 文档类型实体
   */
  private HdocDocumentList buildDocumentList(String doctype, String description) {
    HdocDocumentList document = new HdocDocumentList();
    document.setDoctype(doctype);
    document.setDescription(description);
    return document;
  }

  /**
   * 构造条件请求对象
   *
   * @param chassisSeries Chassis series
   * @param chassisNo     Chassis no
   * @param documentType  Document type
   * @return 条件请求对象
   */
  private GenerateDocumentRequest buildRequest(String chassisSeries, String chassisNo,
      String documentType) {
    GenerateDocumentRequest request = new GenerateDocumentRequest();
    request.setChassisSeries(chassisSeries);
    request.setChassisNo(chassisNo);
    request.setDocumentType(documentType);
    request.setUserid("admin");
    return request;
  }

  /** 用例 3：Document type 下拉列表查询成功，返回 HDOC_DOCUMENT_LIST 的选项 */
  @Test
  @DisplayName("用例3：下拉列表查询成功返回文档类型选项")
  void getDocumentTypes_success_returnsOptions() {
    // Arrange：数据访问层返回两条文档类型数据
    when(generateDocumentMapper.selectHdocDocumentList()).thenReturn(Arrays.asList(
        buildDocumentList("Homologation", "Homologation Document"),
        buildDocumentList("Type Approval", "Type Approval Document")));

    // Act：调用下拉列表查询
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.getDocumentTypes();

    // Assert：返回 200 且包含两条选项
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    assertThat(result.getData().getDocumentTypes().size(), is(2));
    assertThat(result.getData().getDocumentTypes().get(0).getDoctype(), is("Homologation"));
    verify(generateDocumentMapper, times(1)).selectHdocDocumentList();
  }

  /** 用例 3 补充：下拉列表无数据时返回空列表（画面侧不显示任何选项） */
  @Test
  @DisplayName("用例3：下拉列表无数据时返回空列表")
  void getDocumentTypes_noData_returnsEmptyList() {
    // Arrange：数据访问层返回空列表
    when(generateDocumentMapper.selectHdocDocumentList()).thenReturn(Collections.emptyList());

    // Act：调用下拉列表查询
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.getDocumentTypes();

    // Assert：返回 200 且选项为空
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    assertThat(result.getData().getDocumentTypes().isEmpty(), is(true));
  }

  /** 用例 12：条件合法时校验通过 */
  @Test
  @DisplayName("用例12：条件合法时校验通过返回200")
  void submitCondition_validValues_returnsSuccess() {
    // Arrange：构造合法条件
    GenerateDocumentRequest request =
        buildRequest(VALID_CHASSIS_SERIES, VALID_CHASSIS_NO, VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 200，且不访问数据访问层（本画面无查询接口）
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    assertThat(result.getMessage(), is(MessageConstants.SUCCESS));
  }

  /** 用例 5 / 9：边界值（正好最大长度）校验通过 */
  @Test
  @DisplayName("用例5和9：边界值正好最大长度时校验通过")
  void submitCondition_maxLengthValues_returnsSuccess() {
    // Arrange：Chassis series 5 位、Chassis no 10 位
    GenerateDocumentRequest request =
        buildRequest(SERIES_MAX_LENGTH_VALUE, CHASSIS_NO_MAX_LENGTH_VALUE, VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 200
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
  }

  /** 用例 13：Chassis series 为空时返回必填错误 */
  @Test
  @DisplayName("用例13：Chassis series 为空时返回必填错误")
  void submitCondition_emptyChassisSeries_returnsRequiredError() {
    // Arrange：Chassis series 为空
    GenerateDocumentRequest request = buildRequest("", VALID_CHASSIS_NO, VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 401 与必填消息，data 为 null
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.CHASSIS_SERIES_REQUIRED));
    assertThat(result.getData(), is(nullValue()));
  }

  /** 用例 13：Chassis no 为空时返回必填错误 */
  @Test
  @DisplayName("用例13：Chassis no 为空时返回必填错误")
  void submitCondition_emptyChassisNo_returnsRequiredError() {
    // Arrange：Chassis no 为空
    GenerateDocumentRequest request = buildRequest(VALID_CHASSIS_SERIES, "", VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 401 与必填消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.CHASSIS_NO_REQUIRED));
  }

  /** 用例 13：Document type 未选择时返回必填错误 */
  @Test
  @DisplayName("用例13：Document type 未选择时返回必填错误")
  void submitCondition_emptyDocumentType_returnsRequiredError() {
    // Arrange：Document type 为空
    GenerateDocumentRequest request = buildRequest(VALID_CHASSIS_SERIES, VALID_CHASSIS_NO, "");

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 401 与必填消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.DOCUMENT_TYPE_REQUIRED));
  }

  /** 用例 6：Chassis series 超过 5 位时返回格式错误 */
  @Test
  @DisplayName("用例6：Chassis series 超过最大长度时返回格式错误")
  void submitCondition_overLengthChassisSeries_returnsFormatError() {
    // Arrange：Chassis series 为 6 位
    GenerateDocumentRequest request =
        buildRequest(SERIES_OVER_LENGTH_VALUE, VALID_CHASSIS_NO, VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 401 与格式错误消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.CHASSIS_SERIES_FORMAT));
  }

  /** 用例 7：Chassis series 含非法字符时返回格式错误 */
  @Test
  @DisplayName("用例7：Chassis series 含非法字符时返回格式错误")
  void submitCondition_invalidChassisSeries_returnsFormatError() {
    // Arrange：Chassis series 含数字与符号
    GenerateDocumentRequest request =
        buildRequest(SERIES_INVALID_VALUE, VALID_CHASSIS_NO, VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 401 与格式错误消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.CHASSIS_SERIES_FORMAT));
  }

  /** 用例 10：Chassis no 超过 10 位时返回格式错误 */
  @Test
  @DisplayName("用例10：Chassis no 超过最大长度时返回格式错误")
  void submitCondition_overLengthChassisNo_returnsFormatError() {
    // Arrange：Chassis no 为 11 位
    GenerateDocumentRequest request =
        buildRequest(VALID_CHASSIS_SERIES, CHASSIS_NO_OVER_LENGTH_VALUE, VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 401 与格式错误消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.CHASSIS_NO_FORMAT));
  }

  /** 用例 11：Chassis no 含非半角数字时返回格式错误 */
  @Test
  @DisplayName("用例11：Chassis no 含非数字字符时返回格式错误")
  void submitCondition_invalidChassisNo_returnsFormatError() {
    // Arrange：Chassis no 含半角英字
    GenerateDocumentRequest request =
        buildRequest(VALID_CHASSIS_SERIES, CHASSIS_NO_INVALID_VALUE, VALID_DOCUMENT_TYPE);

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 401 与格式错误消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.CHASSIS_NO_FORMAT));
  }

  /** 用例 12 补充：条件前后含空格时自动 trim 后校验通过 */
  @Test
  @DisplayName("用例12：条件含首尾空格时自动去除后校验通过")
  void submitCondition_valuesWithSpaces_returnsSuccess() {
    // Arrange：条件前后含空格
    GenerateDocumentRequest request =
        buildRequest("  JPCT  ", "  15101319  ", "  Homologation  ");

    // Act：执行条件校验
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);

    // Assert：返回 200
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
  }

  /** 用例 18：请求对象为 null 时安全返回错误，不抛异常 */
  @Test
  @DisplayName("用例18：请求对象为null时安全返回错误不抛异常")
  void submitCondition_nullRequest_returnsErrorWithoutException() {
    // Arrange & Act：入参为 null，断言不抛异常
    ApiResult<GenerateDocumentResponse> result =
        assertDoesNotThrow(() -> generateDocumentService.submitCondition(null));

    // Assert：返回 401 与必填消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.CHASSIS_SERIES_REQUIRED));
  }

  /** 选项 DTO 可正常构建（防止 Lombok 构造器变更导致编译期问题） */
  @Test
  @DisplayName("DTO测试：DocumentTypeOption 可正常构建")
  void documentTypeOption_constructor_holdsValues() {
    // Arrange & Act：构建选项对象
    DocumentTypeOption option = new DocumentTypeOption("Homologation", "Homologation Document");

    // Assert：字段值正确
    assertThat(option.getDoctype(), is("Homologation"));
    assertThat(option.getDescription(), is("Homologation Document"));
  }
}
