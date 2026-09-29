Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-7b77-8719-0da194ee0636
  @spec:demonstrates:01a0ebeb-974e-7694-b036-3f33f55702bd
  Scenario: 非相鄰重播紀錄在重新載入後保留
    Given 最近播放紀錄為空
    Given 歌曲 A 和 B 是兩首不同的可播放歌曲
    When 使用者依序播放 A、B、A
    When 每次播放位置都超過三秒
    When 使用者開啟並檢視最近播放紀錄
    When 使用者重新載入應用程式
    When 使用者再次開啟最近播放紀錄
    Then 重新載入前應依新到舊顯示 A、B、A，共三筆
    Then 重新載入後仍應依新到舊顯示 A、B、A，共三筆
