const cards_value =   [ 1 , 2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 , 10 , 10, 10, 10];
const cards_display = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

let player_cards = [];
let dealer_cards = [];

let balance = 100;


function is_soft_hand(hand) {
  if (!hand.includes(0)) {
    return false;
  }
  
  let new_hand = hand.slice();
  new_hand.splice(new_hand.indexOf(0), 1);
  return calculate_hand(new_hand) <= 10;
}

function get_cpu_decision(player_hand, dealer_hand) {
  let dealer_card = cards_value[dealer_hand[0]];
  let player_sum = calculate_hand(player_hand);

  if (player_sum < 12) {
    return "Hit";
  }

  if (player_sum > 17) {
    return "Stand";
  }

  // Soft hand
  if (is_soft_hand(player_hand)) {
    if (player_sum <= 17) {
      return "Hit";
    }

    if (player_sum >= 19) {
      return "Stand";
    }

    if (player_sum === 18) {
      if (dealer_card >= 9 || dealer_card === 0) {
        return "Hit";
      }
    }

    return "Stand";
  }

  // Hard hand
  if (player_sum === 17) {
    return "Stand";
  }

  if (dealer_card >= 7 || dealer_card === 0) {
    return "Hit";
  }

  if (player_sum === 12 && dealer_card <= 3) {
    return "Hit";
  }

  return "Stand";  
}

function ask_cpu_decision() {
  const decision = get_cpu_decision(player_cards, dealer_cards);

  const decision_text = document.getElementById('cpu-decision');

  decision_text.innerHTML = `CPU Decision: ${decision}`;
}

function draw_card() {
  return Math.floor(Math.random() * cards_value.length);
}

function display_hand(hand) {
  let sum = calculate_hand(hand);
  let ace = false;

  for (let i = 0; i < hand.length; i++) {
    if (cards_display[hand[i]] === "A") {
      ace = true;
    }
  }

  if (sum == 21) {
    return "21!";
  }

  if (ace && sum + 10 < 21) {
    return `${sum}/${sum + 10}`;
  }

  return sum;
}

function calculate_hand(hand) {
  let sum = 0;
  let ace = false;

  for (let i = 0; i < hand.length; i++) {
    if (cards_display[hand[i]] === "A") {
      ace = true;
    }
    sum += cards_value[hand[i]];
  }

  if (ace && sum + 10 <= 21) {
    return sum + 10;
  }

  return sum;
}

function deal_cards() {
  const bet_input = document.getElementById('bet');
  const bet_text = document.getElementById('bet-amount');
  const balance_text = document.getElementById('balance');
  const bet = parseInt(bet_input.value);
  balance -= bet;

  balance_text.innerHTML = `Balance: ${balance}$`;

  bet_input.style.display = "none";
  bet_text.innerHTML = `Bet: ${bet}$`;

  const deal_button = document.getElementById('deal-button');
  const ask_cpu_button = document.getElementById('cpu-decision-button');

  ask_cpu_button.style.display = "inline-block";
  deal_button.style.display = "none";

  const dealer_hand = document.getElementById('dealer-hand');
  const player_hand = document.getElementById('player-hand');
  const player_text = document.getElementById('player');
  const dealer_text = document.getElementById('dealer');

  for (let i = 0; i < 2; i++) {
    player_cards.push(draw_card());
    dealer_cards.push(draw_card());
  }

  player_hand.innerHTML = "";
  dealer_hand.innerHTML = "";

  for (let i = 0; i < player_cards.length; i++) {
    player_hand.innerHTML += `<p>${cards_display[player_cards[i]]}</p>`;
  }

  dealer_hand.innerHTML += `<p>${cards_display[dealer_cards[0]]}</p>`;
  dealer_hand.innerHTML += `<p>?</p>`;

  player_text.innerHTML = `Player: ${display_hand(player_cards)}`;
  dealer_text.innerHTML = `Dealer: ?`;

  const hit_button = document.getElementById('hit-button');
  const stand_button = document.getElementById('stand-button');

  hit_button.style.display = "inline-block";
  stand_button.style.display = "inline-block";
}

function hit() {
  const player_hand = document.getElementById('player-hand');
  const player_text = document.getElementById('player');
  const decision_text = document.getElementById('cpu-decision');

  decision_text.innerHTML = "";

  player_cards.push(draw_card());
  player_hand.innerHTML += `<p>${cards_display[player_cards[player_cards.length - 1]]}</p>`;
  player_text.innerHTML = `Player: ${display_hand(player_cards)}`;

  if (calculate_hand(player_cards) > 21) {
    lose_game();
    return;
  }

  if (display_hand(player_cards) === "21!") {
    stand();
  }
}

function stand() {
  const dealer_hand = document.getElementById('dealer-hand');
  const dealer_text = document.getElementById('dealer');
  const decision_text = document.getElementById('cpu-decision');

  decision_text.innerHTML = "";

  dealer_hand.innerHTML = "";

  for (let i = 0; i < dealer_cards.length; i++) {
    dealer_hand.innerHTML += `<p>${cards_display[dealer_cards[i]]}</p>`;
  }

  dealer_text.innerHTML = `Dealer: ${display_hand(dealer_cards)}`;

  while (calculate_hand(dealer_cards) < 17) {
    dealer_cards.push(draw_card());
    dealer_hand.innerHTML += `<p>${cards_display[dealer_cards[dealer_cards.length - 1]]}</p>`;
    dealer_text.innerHTML = `Dealer: ${display_hand(dealer_cards)}`;
  }

  let dealer_sum = calculate_hand(dealer_cards);
  let player_sum = calculate_hand(player_cards);

  if (dealer_sum > 21 || player_sum > dealer_sum) {
    win_game();
    return;
  }

  if (dealer_sum === player_sum) {
    push_game();
    return;
  }

  lose_game();
}

function end_game(text) {
  const hit_button = document.getElementById('hit-button');
  const stand_button = document.getElementById('stand-button');
  const next_button = document.getElementById('next-hand-button');
  const bet_text = document.getElementById('bet-amount');
  const ask_cpu_button = document.getElementById('cpu-decision-button');
  const decision_text = document.getElementById('cpu-decision');

  decision_text.innerHTML = "";
  hit_button.style.display = "none";
  stand_button.style.display = "none";
  next_button.style.display = "inline-block";
  ask_cpu_button.style.display = "none";

  bet_text.innerHTML = text;
}

function win_game() {
  const bet_input = document.getElementById('bet');
  const balance_text = document.getElementById('balance');

  balance += parseInt(bet_input.value) * 2;
  balance_text.innerHTML = `Balance: ${balance}$`;

  end_game("You win!");
}

function lose_game() {
  end_game("You lose!");
}

function push_game() {
  const bet_input = document.getElementById('bet');
  const balance_text = document.getElementById('balance');

  balance += parseInt(bet_input.value);
  balance_text.innerHTML = `Balance: ${balance}$`;

  end_game("Bets are pushed!");
}

function next_hand() {
  const bet_input = document.getElementById('bet');
  const bet_text = document.getElementById('bet-amount');
  const deal_button = document.getElementById('deal-button');
  const next_button = document.getElementById('next-hand-button');
  const player_hand = document.getElementById('player-hand');
  const dealer_hand = document.getElementById('dealer-hand');
  const player_text = document.getElementById('player');
  const dealer_text = document.getElementById('dealer');

  player_cards = [];
  dealer_cards = [];

  player_hand.innerHTML = "";
  dealer_hand.innerHTML = "";
  player_text.innerHTML = "Player";
  dealer_text.innerHTML = "Dealer";

  bet_input.style.display = "inline-block";
  bet_input.value = Math.max(Math.floor(balance/10), 1);
  bet_input.max = balance;
  bet_text.innerHTML = "Bet Amount: ";

  deal_button.style.display = "inline-block";
  next_button.style.display = "none";

  if (balance === 0) {
    alert("You are out of money!");
    restart_game();
  }
}

function restart_game() {
  location.reload();
}
