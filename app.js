(function () {
  "use strict";

  var data = window.OUTING_DATA;
  var storageKeys = {
    teams: "beebeGolf.teams.v1",
    matchups: "beebeGolf.matchups.v1",
    scorecard: "beebeGolf.scorecard.v1"
  };

  var page = document.body.dataset.page;
  var playerById = new Map(data.players.map(function (player) {
    return [player.id, player];
  }));

  document.addEventListener("DOMContentLoaded", function () {
    initNavigation();
    initCurrentYear();

    if (page === "home") renderHome();
    if (page === "players") renderPlayers();
    if (page === "draft") renderDraftBoard();
    if (page === "matchups") renderMatchups();
    if (page === "scoreboard") renderScoreboard();
    if (page === "prizes") renderPrizePool();
  });

  function initNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("#site-nav");
    var currentFile = location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".site-nav a").forEach(function (link) {
      if (link.getAttribute("href") === currentFile) {
        link.setAttribute("aria-current", "page");
      }
    });

    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function initCurrentYear() {
    var year = document.querySelector("[data-current-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function renderHome() {
    var stats = document.querySelector("[data-home-stats]");
    var teamSnapshot = document.querySelector("[data-team-snapshot]");
    if (!stats || !teamSnapshot) return;

    var assignments = getAssignments();
    var white = teamPlayers("white", assignments);
    var blue = teamPlayers("blue", assignments);
    var unassigned = data.players.length - white.length - blue.length;

    stats.innerHTML = [
      statCard("Golfers", data.players.length),
      statCard("Teams", "2 of 12"),
      statCard("Matches", data.event.matches),
      statCard("Bonus Points", "1.0")
    ].join("");

    teamSnapshot.innerHTML =
      '<article class="summary-card team-white">' +
      '<span class="eyebrow">' + data.event.teamWhite + '</span>' +
      '<strong>' + white.length + '/12 drafted</strong>' +
      '<span>' + formatAverage(white) + ' avg course HCP</span>' +
      '</article>' +
      '<article class="summary-card team-blue">' +
      '<span class="eyebrow">' + data.event.teamBlue + '</span>' +
      '<strong>' + blue.length + '/12 drafted</strong>' +
      '<span>' + formatAverage(blue) + ' avg course HCP</span>' +
      '</article>' +
      '<article class="summary-card">' +
      '<span class="eyebrow">Draft Pool</span>' +
      '<strong>' + unassigned + ' unassigned</strong>' +
      '<span>Live draft: ' + data.event.draftDate + '</span>' +
      '</article>';
  }

  function renderPlayers() {
    var table = document.querySelector("[data-player-table]");
    var cards = document.querySelector("[data-player-cards]");
    var filter = document.querySelector("[data-player-filter]");
    if (!table || !cards) return;

    function render() {
      var query = filter ? filter.value.trim().toLowerCase() : "";
      var players = data.players.filter(function (player) {
        return player.name.toLowerCase().indexOf(query) !== -1;
      });

      table.innerHTML = players.map(function (player, index) {
        return '<tr>' +
          '<td>' + (index + 1) + '</td>' +
          '<td><strong>' + escapeHtml(player.name) + '</strong></td>' +
          '<td>' + formatIndex(player.index) + '</td>' +
          '<td>' + formatCourseHcp(player.courseHcp) + '</td>' +
          '</tr>';
      }).join("");

      cards.innerHTML = players.map(function (player) {
        return '<article class="player-card">' +
          '<div><strong>' + escapeHtml(player.name) + '</strong><span>Index ' + formatIndex(player.index) + '</span></div>' +
          '<span class="hcp-pill">' + formatCourseHcp(player.courseHcp) + '</span>' +
          '</article>';
      }).join("");
    }

    if (filter) filter.addEventListener("input", render);
    render();
  }

  function renderDraftBoard() {
    var root = document.querySelector("[data-draft-board]");
    if (!root) return;

    var assignments = getAssignments();
    var white = teamPlayers("white", assignments);
    var blue = teamPlayers("blue", assignments);
    var unassigned = data.players.filter(function (player) {
      return !assignments[player.id];
    });
    var teamCounts = { white: white.length, blue: blue.length };

    root.innerHTML =
      '<section class="team-grid" aria-label="Draft summary">' +
      teamSummary("white", white) +
      teamSummary("blue", blue) +
      '<article class="summary-card"><span class="eyebrow">Unassigned</span><strong>' + unassigned.length + '</strong><span>Draft starts blank until ' + data.event.draftDate + '</span></article>' +
      '</section>' +
      '<div class="toolbar"><p>' + data.players.length + ' golfers loaded</p><button class="button button-secondary" type="button" data-action="clear-draft">Clear draft</button></div>' +
      '<section class="draft-list" aria-label="Draft player assignments">' +
      data.players.map(function (player) {
        return draftPlayerRow(player, assignments[player.id] || "", teamCounts);
      }).join("") +
      '</section>';

    root.onclick = onDraftClick;
  }

  function onDraftClick(event) {
    var action = event.target.closest("[data-action]");
    if (!action) return;

    if (action.dataset.action === "set-team") {
      var assignments = getAssignments();
      assignments[action.dataset.playerId] = action.dataset.team;
      saveJson(storageKeys.teams, assignments);
      renderDraftBoard();
      return;
    }

    if (action.dataset.action === "clear-draft") {
      if (window.confirm("Clear all team assignments? Matchups and scores will stay saved.")) {
        saveJson(storageKeys.teams, {});
        renderDraftBoard();
      }
    }
  }

  function renderMatchups() {
    var root = document.querySelector("[data-matchups]");
    if (!root) return;

    var assignments = getAssignments();
    var matchups = getMatchups();
    var white = teamPlayers("white", assignments);
    var blue = teamPlayers("blue", assignments);
    var selected = selectedMatchupIds(matchups);
    var notice = white.length < 2 || blue.length < 2
      ? '<div class="notice">Assign golfers to Team White and Team Blue before setting all six pairing matches.</div>'
      : "";

    root.innerHTML =
      '<section class="team-grid" aria-label="Pairing summary">' +
      teamSummary("white", white) +
      teamSummary("blue", blue) +
      '<article class="summary-card"><span class="eyebrow">Pairing Matches</span><strong>' + completedMatchups(matchups) + '/' + data.event.matches + '</strong><span>Two golfers per team per match</span></article>' +
      '</section>' +
      notice +
      '<div class="toolbar"><p>Six matches, one point each</p><button class="button button-secondary" type="button" data-action="clear-matchups">Clear matchups</button></div>' +
      '<section class="matchup-grid" aria-label="Pairing matchups">' +
      matchups.map(function (match, index) {
        return matchupCard(match, index, assignments, selected);
      }).join("") +
      '</section>';

    root.onchange = onMatchupChange;
    root.onclick = onMatchupClick;
  }

  function onMatchupChange(event) {
    var select = event.target.closest("[data-match-index]");
    if (!select) return;

    var matchups = getMatchups();
    var matchIndex = Number(select.dataset.matchIndex);
    matchups[matchIndex][select.dataset.slot] = select.value;
    saveJson(storageKeys.matchups, matchups);
    renderMatchups();
  }

  function onMatchupClick(event) {
    var action = event.target.closest("[data-action]");
    if (!action) return;

    if (action.dataset.action === "clear-matchups") {
      if (window.confirm("Clear all matchups? Scoreboard entries will stay saved.")) {
        saveJson(storageKeys.matchups, emptyMatchups());
        renderMatchups();
      }
    }
  }

  function renderScoreboard() {
    var root = document.querySelector("[data-scoreboard]");
    if (!root) return;

    var scorecard = getScorecard();
    var matchups = getMatchups();
    var score = calculateScore(scorecard);
    var status = score.white === score.blue
      ? "All square"
      : (score.white > score.blue ? data.event.teamWhite : data.event.teamBlue) + " leads by " + Math.abs(score.white - score.blue).toFixed(1);

    root.innerHTML =
      '<section class="score-hero" aria-label="Current score">' +
      '<article class="score-box team-white"><span>' + data.event.teamWhite + '</span><strong>' + score.white.toFixed(1) + '</strong></article>' +
      '<article class="score-status"><span class="eyebrow">Current Standing</span><strong>' + status + '</strong><span>6 match points + 1 bonus point</span></article>' +
      '<article class="score-box team-blue"><span>' + data.event.teamBlue + '</span><strong>' + score.blue.toFixed(1) + '</strong></article>' +
      '</section>' +
      '<div class="toolbar"><p>Enter results as they finish</p><button class="button button-secondary" type="button" data-action="clear-scorecard">Clear scores</button></div>' +
      '<section class="score-grid" aria-label="Match scoring">' +
      scorecard.matches.map(function (result, index) {
        return scoreMatchCard(result, index, matchups[index]);
      }).join("") +
      '</section>' +
      '<section class="bonus-grid" aria-label="Bonus scoring">' +
      bonusCard("closest", "Closest to the Pin", scorecard.bonuses.closest) +
      bonusCard("longest", "Longest Drive", scorecard.bonuses.longest) +
      '</section>';

    root.onchange = onScoreChange;
    root.oninput = onScoreInput;
    root.onclick = onScoreClick;
  }

  function onScoreChange(event) {
    var field = event.target.closest("[data-score-field]");
    if (!field) return;

    var scorecard = getScorecard();
    if (field.dataset.scoreField === "match") {
      scorecard.matches[Number(field.dataset.matchIndex)] = field.value;
    }
    if (field.dataset.scoreField === "bonus-team") {
      scorecard.bonuses[field.dataset.bonus].team = field.value;
    }
    saveJson(storageKeys.scorecard, scorecard);
    renderScoreboard();
  }

  function onScoreInput(event) {
    var field = event.target.closest("[data-bonus-winner]");
    if (!field) return;

    var scorecard = getScorecard();
    scorecard.bonuses[field.dataset.bonus].winner = field.value;
    saveJson(storageKeys.scorecard, scorecard);
  }

  function onScoreClick(event) {
    var action = event.target.closest("[data-action]");
    if (!action) return;

    if (action.dataset.action === "clear-scorecard") {
      if (window.confirm("Clear all scores and bonus winners?")) {
        saveJson(storageKeys.scorecard, emptyScorecard());
        renderScoreboard();
      }
    }
  }

  function renderPrizePool() {
    var root = document.querySelector("[data-prize-pool]");
    if (!root) return;

    var pool = data.prizePool;
    var totalPot = pool.buyIn * pool.golfers;

    root.innerHTML =
      '<section class="pot-grid" aria-label="Prize pool totals">' +
      statCard("Buy-in", formatMoney(pool.buyIn)) +
      statCard("Golfers", pool.golfers) +
      statCard("Total Pot", formatMoney(totalPot)) +
      statCard("Winning Team", "$300 / 12") +
      '</section>' +
      '<section class="payout-list" aria-label="Prize payouts">' +
      pool.payouts.map(function (payout) {
        var perPlayer = payout.perPlayer ? '<span>' + formatMoney(payout.perPlayer) + ' per winning-team golfer</span>' : "";
        return '<article class="payout-card"><div><span class="eyebrow">' + escapeHtml(payout.detail) + '</span><strong>' + escapeHtml(payout.label) + '</strong>' + perPlayer + '</div><span class="payout-amount">' + formatMoney(payout.amount) + '</span></article>';
      }).join("") +
      '</section>';
  }

  function statCard(label, value) {
    return '<article class="stat-card"><span>' + label + '</span><strong>' + value + '</strong></article>';
  }

  function teamSummary(team, players) {
    var label = team === "white" ? data.event.teamWhite : data.event.teamBlue;
    return '<article class="summary-card team-' + team + '"><span class="eyebrow">' + label + '</span><strong>' + players.length + '/12</strong><span>' + formatAverage(players) + ' avg course HCP</span></article>';
  }

  function draftPlayerRow(player, assignedTeam, teamCounts) {
    var controls = [
      ["", "Unassigned"],
      ["white", "White"],
      ["blue", "Blue"]
    ].map(function (item) {
      var team = item[0];
      var label = item[1];
      var isSelected = assignedTeam === team;
      var isDisabled = team && assignedTeam !== team && teamCounts[team] >= 12;
      return '<button class="team-choice ' + (isSelected ? 'is-selected' : '') + '" type="button" data-action="set-team" data-player-id="' + player.id + '" data-team="' + team + '" aria-pressed="' + isSelected + '" ' + (isDisabled ? 'disabled' : '') + '>' + label + '</button>';
    }).join("");

    return '<article class="draft-card"><div class="player-meta"><strong>' + escapeHtml(player.name) + '</strong><span>Index ' + formatIndex(player.index) + ' | Course HCP ' + formatCourseHcp(player.courseHcp) + '</span></div><div class="team-control" aria-label="Team assignment for ' + escapeAttr(player.name) + '">' + controls + '</div></article>';
  }

  function matchupCard(match, index, assignments, selected) {
    return '<article class="match-card">' +
      '<div class="match-card-header"><span class="eyebrow">Match ' + (index + 1) + '</span><strong>' + escapeHtml(matchLabel(match)) + '</strong></div>' +
      '<div class="pairing-fields">' +
      playerSelect(index, "white1", "White Player 1", "white", match.white1, assignments, selected) +
      playerSelect(index, "white2", "White Player 2", "white", match.white2, assignments, selected) +
      playerSelect(index, "blue1", "Blue Player 1", "blue", match.blue1, assignments, selected) +
      playerSelect(index, "blue2", "Blue Player 2", "blue", match.blue2, assignments, selected) +
      '</div></article>';
  }

  function playerSelect(matchIndex, slot, label, team, currentId, assignments, selected) {
    var options = teamPlayers(team, assignments).map(function (player) {
      var disabled = selected.has(player.id) && player.id !== currentId;
      return '<option value="' + player.id + '" ' + (currentId === player.id ? 'selected' : '') + ' ' + (disabled ? 'disabled' : '') + '>' + escapeHtml(player.name) + ' (' + formatCourseHcp(player.courseHcp) + ')</option>';
    }).join("");

    return '<label><span>' + label + '</span><select data-match-index="' + matchIndex + '" data-slot="' + slot + '"><option value="">Select golfer</option>' + options + '</select></label>';
  }

  function scoreMatchCard(result, index, matchup) {
    return '<article class="score-card"><div><span class="eyebrow">Match ' + (index + 1) + '</span><strong>' + escapeHtml(matchLabel(matchup)) + '</strong></div><label><span>Result</span><select data-score-field="match" data-match-index="' + index + '">' + scoreOption("", "Pending", result) + scoreOption("white", data.event.teamWhite, result) + scoreOption("blue", data.event.teamBlue, result) + scoreOption("tie", "Tie", result) + '</select></label></article>';
  }

  function bonusCard(key, label, bonus) {
    return '<article class="bonus-card"><div><span class="eyebrow">0.5 point</span><strong>' + label + '</strong></div><div class="bonus-fields"><label><span>Team</span><select data-score-field="bonus-team" data-bonus="' + key + '">' + scoreOption("", "Pending", bonus.team) + scoreOption("white", data.event.teamWhite, bonus.team) + scoreOption("blue", data.event.teamBlue, bonus.team) + '</select></label><label><span>Winner</span><input type="text" value="' + escapeAttr(bonus.winner) + '" data-bonus-winner data-bonus="' + key + '" placeholder="Golfer name"></label></div></article>';
  }

  function scoreOption(value, label, current) {
    return '<option value="' + value + '" ' + (current === value ? 'selected' : '') + '>' + label + '</option>';
  }

  function getAssignments() {
    var stored = loadJson(storageKeys.teams, {});
    var assignments = {};
    data.players.forEach(function (player) {
      assignments[player.id] = stored[player.id] === "white" || stored[player.id] === "blue" ? stored[player.id] : "";
    });
    return assignments;
  }

  function getMatchups() {
    var stored = loadJson(storageKeys.matchups, emptyMatchups());
    var matchups = emptyMatchups();
    if (!Array.isArray(stored)) return matchups;

    stored.slice(0, data.event.matches).forEach(function (match, index) {
      ["white1", "white2", "blue1", "blue2"].forEach(function (slot) {
        matchups[index][slot] = playerById.has(match[slot]) ? match[slot] : "";
      });
    });
    return matchups;
  }

  function getScorecard() {
    var stored = loadJson(storageKeys.scorecard, emptyScorecard());
    var scorecard = emptyScorecard();

    if (Array.isArray(stored.matches)) {
      stored.matches.slice(0, data.event.matches).forEach(function (result, index) {
        scorecard.matches[index] = ["white", "blue", "tie"].indexOf(result) !== -1 ? result : "";
      });
    }

    if (stored.bonuses) {
      ["closest", "longest"].forEach(function (key) {
        var bonus = stored.bonuses[key] || {};
        scorecard.bonuses[key] = {
          team: ["white", "blue"].indexOf(bonus.team) !== -1 ? bonus.team : "",
          winner: typeof bonus.winner === "string" ? bonus.winner : ""
        };
      });
    }

    return scorecard;
  }

  function emptyMatchups() {
    return Array.from({ length: data.event.matches }, function () {
      return { white1: "", white2: "", blue1: "", blue2: "" };
    });
  }

  function emptyScorecard() {
    return {
      matches: Array.from({ length: data.event.matches }, function () { return ""; }),
      bonuses: {
        closest: { team: "", winner: "" },
        longest: { team: "", winner: "" }
      }
    };
  }

  function calculateScore(scorecard) {
    return scorecard.matches.reduce(function (score, result) {
      if (result === "white") score.white += 1;
      if (result === "blue") score.blue += 1;
      if (result === "tie") {
        score.white += 0.5;
        score.blue += 0.5;
      }
      return score;
    }, bonusScore(scorecard));
  }

  function bonusScore(scorecard) {
    var score = { white: 0, blue: 0 };
    Object.keys(scorecard.bonuses).forEach(function (key) {
      var bonus = scorecard.bonuses[key];
      if (bonus.team === "white") score.white += 0.5;
      if (bonus.team === "blue") score.blue += 0.5;
    });
    return score;
  }

  function teamPlayers(team, assignments) {
    return data.players.filter(function (player) {
      return assignments[player.id] === team;
    });
  }

  function selectedMatchupIds(matchups) {
    var selected = new Set();
    matchups.forEach(function (match) {
      Object.keys(match).forEach(function (slot) {
        if (match[slot]) selected.add(match[slot]);
      });
    });
    return selected;
  }

  function completedMatchups(matchups) {
    return matchups.filter(function (match) {
      return match.white1 && match.white2 && match.blue1 && match.blue2;
    }).length;
  }

  function matchLabel(match) {
    if (!match) return "Pairing not set";
    var whiteNames = [match.white1, match.white2].map(playerName).filter(Boolean).join(" / ");
    var blueNames = [match.blue1, match.blue2].map(playerName).filter(Boolean).join(" / ");
    if (!whiteNames && !blueNames) return "Pairing not set";
    return (whiteNames || "Team White TBD") + " vs " + (blueNames || "Team Blue TBD");
  }

  function playerName(id) {
    var player = playerById.get(id);
    return player ? player.name : "";
  }

  function formatAverage(players) {
    if (!players.length) return "0.0";
    var total = players.reduce(function (sum, player) {
      return sum + player.courseHcp;
    }, 0);
    return (total / players.length).toFixed(1);
  }

  function formatIndex(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function formatCourseHcp(value) {
    return String(value);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function loadJson(key, fallback) {
    try {
      var value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      window.alert("This browser could not save the latest change.");
    }
  }
}());
