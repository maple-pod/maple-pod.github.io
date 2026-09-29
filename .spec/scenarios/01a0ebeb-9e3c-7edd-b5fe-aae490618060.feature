Feature: 相鄰重播去重並即時保留非相鄰重播
  @spec:id:01a0ebeb-9e3c-7f01-b4a9-89d434528c47
  @spec:demonstrates:01a0ebeb-974e-7694-b036-3f33f55702bd
  Scenario: 相鄰重播去重並即時保留非相鄰重播
    Given 最近播放紀錄為空
    Given 歌曲 A 和 B 是兩首不同的可播放歌曲
    When 使用者播放 A 至超過三秒並檢視最近播放紀錄
    When 使用者重新選擇 A 播放至超過三秒並檢視紀錄
    When 使用者播放 B 至超過三秒並檢視紀錄
    When 使用者重新選擇 B 播放至超過三秒並檢視紀錄
    When 使用者再次播放 A 至超過三秒並檢視紀錄
    Then 第一次檢視應依新到舊顯示 [A]
    Then 第二次檢視應顯示 [A]
    Then 第三次檢視應顯示 [B, A]
    Then 第四次檢視應顯示 [B, A]
    Then 第五次檢視應顯示 [A, B, A]
