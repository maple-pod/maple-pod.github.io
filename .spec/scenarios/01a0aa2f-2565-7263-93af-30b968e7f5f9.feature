Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-79a5-bc3c-bbc2d316bf5e
  @spec:demonstrates:01a0ebeb-983f-7c06-a52c-17dc3fad83be
  Scenario: 保留目前曲庫無法解析的最近播放紀錄
    Given 已儲存的最近播放紀錄包含目前曲庫中的歌曲 A
    Given 也包含目前曲庫無法解析的歌曲 X
    When 使用者開啟應用程式並檢視最近播放紀錄
    When 使用者重新載入應用程式並再次檢視最近播放紀錄
    Then 首次檢視應依原有順序顯示 A 與標示為不可用的 X
    Then 持久化的最近播放紀錄應保留 A 與 X
    Then 重新載入後仍應保留兩筆紀錄，且 X 不得啟動播放
