Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-79a5-bc3c-bbc2d316bf5e
  @spec:demonstrates:01a0ebeb-983f-7c06-a52c-17dc3fad83be
  Scenario: 永久失效的最近播放紀錄會被持久移除
    Given 已儲存的最近播放紀錄包含目前曲庫中的歌曲 A
    Given 也包含目前曲庫無法解析的歌曲 X
    When 使用者開啟應用程式並檢視最近播放紀錄
    When 使用者重新載入應用程式並再次檢視最近播放紀錄
    Then 首次檢視應只顯示 A，不顯示 X
    Then 持久化的最近播放紀錄應保留 A 並移除 X
    Then 重新載入後仍應只顯示 A
