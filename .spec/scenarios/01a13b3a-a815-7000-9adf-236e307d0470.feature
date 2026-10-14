Feature: 保留並呈現無法解析的播放清單歌曲
  @spec:id:01a13b3a-a815-7188-95d0-bd4c1b3e8be6
  @spec:demonstrates:01a0a9ae-f612-785a-a8f3-1aa475eb8c2f
  Scenario: 保留並呈現無法解析的播放清單歌曲
    Given Liked 或自訂播放清單已持久保存一個目前曲庫無法解析的歌曲 ID
    When Maple Pod 正規化儲存資料並顯示該播放清單
    Then 該歌曲 ID 仍保留在已持久化的播放清單中
    Then 播放清單明確將該歌曲 ID 呈現為不可用
    Then 該歌曲 ID 不得啟動播放，且使用者可明確將其移除
