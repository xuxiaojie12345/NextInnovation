package com.web.app;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.web.app.domain.entity.HdocDocumentList;
import com.web.app.dto.UD03SelectHdocdocumentlistData;
import com.web.app.dto.UD03SelectHdocdocumentlistResponse;
import com.web.app.dto.UD04SelectGeneratedocumentData;
import com.web.app.dto.UD04SelectGeneratedocumentRequest;
import com.web.app.dto.UD04SelectGeneratedocumentResponse;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.mapper.HdocRecDataVdaGeneralMapper;
import com.web.app.service.impl.GenerateDocumentServiceImpl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * ドキュメント生成サービス実装クラス（GenerateDocumentServiceImpl）の単体テスト
 *
 * <p>テスト対象：
 * <ul>
 *   <li>{@link GenerateDocumentServiceImpl#uD03SelectHdocdocumentlist()}</li>
 *   <li>{@link GenerateDocumentServiceImpl#uD04SelectGeneratedocument(UD04SelectGeneratedocumentRequest)}</li>
 * </ul>
 *
 * <p>網羅する分岐（100% 分岐カバレッジ）：
 * <ol>
 *   <li>UD03：Mapper がリストを返す（要素あり / 空リスト）／null を返す（null 分岐）</li>
 *   <li>UD03：ループ 0 回・複数回、doctype が null の要素</li>
 *   <li>UD04：request == null（null 分岐）</li>
 *   <li>UD04：chassisSeries が null / 空文字 / 空白のみ（isBlank 分岐）</li>
 *   <li>UD04：chassisNo が null / 空文字 / 空白のみ（isBlank 分岐）</li>
 *   <li>UD04：Mapper がデータを返す（取得成功 → code=200）／null を返す（データなし → code=404）</li>
 * </ol>
 *
 * <p>Mapper は Mockito でモック化するため DB 接続は不要。
 */
@ExtendWith(MockitoExtension.class)
class GenerateDocumentServiceImplTest {

    /** DocumentType 照会 Mapper（モック） */
    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    /** Chassis 関連データ照会 Mapper（モック） */
    @Mock
    private HdocRecDataVdaGeneralMapper hdocRecDataVdaGeneralMapper;

    /** テスト対象（@InjectMocks により上記モックが注入される） */
    @InjectMocks
    private GenerateDocumentServiceImpl generateDocumentService;

    // ============================================================
    // テストデータ生成ヘルパー
    // ============================================================

    /** HdocDocumentList を生成するヘルパー */
    private static HdocDocumentList document(String doctype) {
        HdocDocumentList document = new HdocDocumentList();
        document.setDoctype(doctype);
        return document;
    }

    /** UD04 リクエスト DTO を生成するヘルパー */
    private static UD04SelectGeneratedocumentRequest request(String chassisSeries, String chassisNo) {
        UD04SelectGeneratedocumentRequest request = new UD04SelectGeneratedocumentRequest();
        request.setChassisSeries(chassisSeries);
        request.setChassisNo(chassisNo);
        return request;
    }

    /** UD04 データ DTO を生成するヘルパー */
    private static UD04SelectGeneratedocumentData generatedDocumentData() {
        UD04SelectGeneratedocumentData data = new UD04SelectGeneratedocumentData();
        data.setOrdernumber("ON-0001");
        data.setBuild("202410");
        data.setSpec("SPEC-A");
        data.setCustrAdap("S-NOTE-1");
        data.setCountryOfOperation("JP");
        data.setLoadIndex("LI-01");
        return data;
    }

    /** UD04 必須チェックエラー（code=400）の共通検証 */
    private static void assertBadRequest(UD04SelectGeneratedocumentResponse response) {
        assertThat(response.getCode()).isEqualTo(400);
        assertThat(response.getMessage()).isEqualTo("Chassis series and Chassis no are required.");
        assertThat(response.getData()).isNull();
    }

    // ============================================================
    // 1. uD03SelectHdocdocumentlist（DocumentType 取得）
    // ============================================================

    @Test
    @DisplayName("uD03SelectHdocdocumentlist: リストが取得できた場合、code=200 と doctype 一覧を返す")
    void uD03SelectHdocdocumentlist_success() {
        // 準備：Mapper が 2 件のドキュメントを返す
        when(hdocDocumentListMapper.getDocumentType())
                .thenReturn(Arrays.asList(document("documentType1"), document("documentType2")));

        // 実行
        UD03SelectHdocdocumentlistResponse response =
                generateDocumentService.uD03SelectHdocdocumentlist();

        // 検証（取得成功分岐・ループ複数回）
        assertThat(response.getCode()).isEqualTo(200);
        assertThat(response.getMessage()).isEqualTo("查询成功");
        UD03SelectHdocdocumentlistData data = response.getData();
        assertThat(data).isNotNull();
        assertThat(data.getDocumentTypeList())
                .hasSize(2)
                .containsExactly("documentType1", "documentType2");

        // Mapper が呼び出されたこと
        verify(hdocDocumentListMapper).getDocumentType();
        // UD04 用 Mapper は呼び出されないこと
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
    }

    @Test
    @DisplayName("uD03SelectHdocdocumentlist: リストが空の場合、code=200 と空リストを返す")
    void uD03SelectHdocdocumentlist_emptyList() {
        // 準備：Mapper が空リストを返す（ループ 0 回）
        when(hdocDocumentListMapper.getDocumentType())
                .thenReturn(Collections.emptyList());

        // 実行
        UD03SelectHdocdocumentlistResponse response =
                generateDocumentService.uD03SelectHdocdocumentlist();

        // 検証
        assertThat(response.getCode()).isEqualTo(200);
        assertThat(response.getMessage()).isEqualTo("查询成功");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getDocumentTypeList()).isEmpty();

        verify(hdocDocumentListMapper).getDocumentType();
    }

    @Test
    @DisplayName("uD03SelectHdocdocumentlist: Mapper が null を返した場合、code=200 と空リストを返す")
    void uD03SelectHdocdocumentlist_nullList() {
        // 準備：Mapper が null を返す（null 分岐）
        when(hdocDocumentListMapper.getDocumentType()).thenReturn(null);

        // 実行
        UD03SelectHdocdocumentlistResponse response =
                generateDocumentService.uD03SelectHdocdocumentlist();

        // 検証（null 防御により空リストが設定される）
        assertThat(response.getCode()).isEqualTo(200);
        assertThat(response.getMessage()).isEqualTo("查询成功");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getDocumentTypeList()).isNotNull().isEmpty();

        verify(hdocDocumentListMapper).getDocumentType();
    }

    @Test
    @DisplayName("uD03SelectHdocdocumentlist: doctype が null の要素が含まれる場合、null のまま一覧に追加される")
    void uD03SelectHdocdocumentlist_elementDoctypeIsNull() {
        // 準備：doctype が null の要素を含むリスト
        when(hdocDocumentListMapper.getDocumentType())
                .thenReturn(Collections.singletonList(document(null)));

        // 実行
        UD03SelectHdocdocumentlistResponse response =
                generateDocumentService.uD03SelectHdocdocumentlist();

        // 検証
        assertThat(response.getCode()).isEqualTo(200);
        List<String> documentTypeList = response.getData().getDocumentTypeList();
        assertThat(documentTypeList).hasSize(1);
        assertThat(documentTypeList.get(0)).isNull();

        verify(hdocDocumentListMapper).getDocumentType();
    }

    // ============================================================
    // 2. uD04SelectGeneratedocument（Chassis 関連データ取得）
    //    － 入力パラメータの必須チェック（null / 空文字 / 空白）
    // ============================================================

    @Test
    @DisplayName("uD04SelectGeneratedocument: request が null の場合、code=400 を返し Mapper を呼び出さない")
    void uD04SelectGeneratedocument_requestIsNull() {
        // 実行
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(null);

        // 検証（null 分岐）
        assertBadRequest(response);
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("uD04SelectGeneratedocument: chassisSeries が null の場合、code=400 を返し Mapper を呼び出さない")
    void uD04SelectGeneratedocument_chassisSeriesIsNull() {
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request(null, "1234567890"));

        assertBadRequest(response);
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
    }

    @Test
    @DisplayName("uD04SelectGeneratedocument: chassisSeries が空文字の場合、code=400 を返し Mapper を呼び出さない")
    void uD04SelectGeneratedocument_chassisSeriesIsEmpty() {
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request("", "1234567890"));

        assertBadRequest(response);
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
    }

    @Test
    @DisplayName("uD04SelectGeneratedocument: chassisSeries が空白のみの場合、code=400 を返し Mapper を呼び出さない")
    void uD04SelectGeneratedocument_chassisSeriesIsBlank() {
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request("   ", "1234567890"));

        assertBadRequest(response);
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
    }

    @Test
    @DisplayName("uD04SelectGeneratedocument: chassisNo が null の場合、code=400 を返し Mapper を呼び出さない")
    void uD04SelectGeneratedocument_chassisNoIsNull() {
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request("12345", null));

        assertBadRequest(response);
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
    }

    @Test
    @DisplayName("uD04SelectGeneratedocument: chassisNo が空文字の場合、code=400 を返し Mapper を呼び出さない")
    void uD04SelectGeneratedocument_chassisNoIsEmpty() {
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request("12345", ""));

        assertBadRequest(response);
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
    }

    @Test
    @DisplayName("uD04SelectGeneratedocument: chassisNo が空白のみの場合、code=400 を返し Mapper を呼び出さない")
    void uD04SelectGeneratedocument_chassisNoIsBlank() {
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request("12345", "   "));

        assertBadRequest(response);
        verifyNoInteractions(hdocRecDataVdaGeneralMapper);
    }

    // ============================================================
    // 3. uD04SelectGeneratedocument（Chassis 関連データ取得）
    //    － 取得成功 / データなし
    // ============================================================

    @Test
    @DisplayName("uD04SelectGeneratedocument: データが取得できた場合、code=200 とデータを返す")
    void uD04SelectGeneratedocument_success() {
        // 準備：Mapper がデータを返す
        UD04SelectGeneratedocumentData expected = generatedDocumentData();
        when(hdocRecDataVdaGeneralMapper.getChassisData("12345", "1234567890"))
                .thenReturn(expected);

        // 実行
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request("12345", "1234567890"));

        // 検証（取得成功分岐）
        assertThat(response.getCode()).isEqualTo(200);
        assertThat(response.getMessage()).isEqualTo("查询成功");
        assertThat(response.getData()).isSameAs(expected);
        assertThat(response.getData().getOrdernumber()).isEqualTo("ON-0001");

        // Mapper が入力値で呼び出されたこと
        verify(hdocRecDataVdaGeneralMapper).getChassisData("12345", "1234567890");
    }

    @Test
    @DisplayName("uD04SelectGeneratedocument: データが存在しない場合、code=404 とエラーメッセージを返す")
    void uD04SelectGeneratedocument_dataNotFound() {
        // 準備：Mapper が null を返す
        when(hdocRecDataVdaGeneralMapper.getChassisData("99999", "0000000000"))
                .thenReturn(null);

        // 実行
        UD04SelectGeneratedocumentResponse response =
                generateDocumentService.uD04SelectGeneratedocument(request("99999", "0000000000"));

        // 検証（データなし分岐）
        assertThat(response.getCode()).isEqualTo(404);
        assertThat(response.getMessage()).isEqualTo("No chassis data found.");
        assertThat(response.getData()).isNull();

        // Mapper が入力値で呼び出されたこと
        verify(hdocRecDataVdaGeneralMapper).getChassisData("99999", "0000000000");
    }
}
