Feature: Return to recently heard music
  @spec:id:01a0aa2f-2565-77c2-a3d1-9929fc605ce7
  @spec:demonstrates:01a0ebeb-96ce-72ec-b2d9-8a7e171a71ec
  Scenario: 未達播放門檻即切換歌曲不會產生歷史紀錄
    Given 最近播放紀錄為空
    Given 歌曲 A 和 B 是兩首不同的可播放歌曲
    When 使用者開始播放 A
    When 使用者在 A 播放位置明確小於三秒時切換至 B
    When 使用者在 B 播放位置明確小於三秒時檢視最近播放紀錄
    Then 最近播放紀錄應保持為空
