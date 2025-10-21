let capital = 1000000;
const spinSound = document.getElementById('spinSound');

const investments = {
  stocks: {range: [-10,15], step:2, canvas: document.getElementById('wheelStocks')},
  deposit: {range: [-10,10], step:2, canvas: document.getElementById('wheelDeposit')},
  business: {range: [-70,50], step:5, canvas: document.getElementById('wheelBusiness')},
  realty: {range: [2,10], step:1, canvas: document.getElementById('wheelRealty')}
};

// создаём массивы процентов для каждого колеса
for (let key in investments){
  const info = investments[key];
  info.values = [];
  for(let i=info.range[0]; i<=info.range[1]; i+=info.step) info.values.push(i);
  info.ctx = info.canvas.getContext('2d');
  info.radius = info.canvas.width/2;
}

function drawWheel(values, ctx, radius, rotation=0){
  ctx.clearRect(0,0, radius*2, radius*2);
  const anglePer = (2*Math.PI)/values.length;
  for(let i=0;i<values.length;i++){
    ctx.beginPath();
    ctx.moveTo(radius,radius);
    ctx.arc(radius,radius,radius, i*anglePer + rotation, (i+1)*anglePer + rotation);
    ctx.fillStyle = i%2===0 ? '#3498db' : '#e74c3c';
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();

    ctx.save();
    ctx.translate(radius,radius);
    ctx.rotate(i*anglePer + anglePer/2 + rotation);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillText(values[i]+'%', radius-10,0);
    ctx.restore();
  }

  // стрелка
  ctx.beginPath();
  ctx.moveTo(radius,radius - radius - 5);
  ctx.lineTo(radius-8,radius - radius +15);
  ctx.lineTo(radius+8,radius - radius +15);
  ctx.fillStyle="white";
  ctx.fill();
}

// нарисовать все колеса по умолчанию
for(let key in investments){
  const info = investments[key];
  drawWheel(info.values, info.ctx, info.radius);
}

// ---------------- Auto Fill ----------------
document.getElementById('autoFill').addEventListener('click',()=>{
  const arr = ['stocks','deposit','business','realty'];
  let totalEntered = 0;
  const values = {};
  arr.forEach(k=>{
    values[k] = parseInt(document.getElementById(k).value) || 0;
    totalEntered += values[k];
  });
  let remaining = capital - totalEntered;
  if(remaining <= 0) return;

  const emptyFields = arr.filter(k => values[k] === 0);

  if(emptyFields.length === 0){
    // все поля заполнены, оставшееся добавляем в "realty"
    const minRisk = 'realty';
    document.getElementById(minRisk).value = values[minRisk] + remaining;
  } else {
    if(totalEntered === 0){
      let perField = Math.floor(remaining / arr.length);
      arr.forEach(k => document.getElementById(k).value = perField);
      let leftover = remaining - perField*arr.length;
      if(leftover>0) document.getElementById('realty').value += leftover;
    } else {
      // распределяем оставшееся по пустым полям
      while(remaining > 0){
        emptyFields.forEach(k=>{
          if(remaining<=0) return;
          let add = Math.min(Math.ceil(remaining / emptyFields.length), remaining);
          document.getElementById(k).value = (parseInt(document.getElementById(k).value) || 0) + add;
          remaining -= add;
        });
      }
    }
  }
});

// ---------------- Spin ----------------
document.getElementById('spinButton').addEventListener('click',()=>{
  const arr = ['stocks','deposit','business','realty'];
  const amounts = {};
  let totalInvest = 0;
  arr.forEach(k=>{
    amounts[k] = parseInt(document.getElementById(k).value) || 0;
    totalInvest += amounts[k];
  });
  const message = document.getElementById('message');
  if(totalInvest <=0){ message.textContent="Enter some investment amounts!"; return;}
  if(totalInvest>capital){ message.textContent=`You only have ${capital} Tenge, can't invest ${totalInvest}`; return;}
  capital -= totalInvest;
  document.getElementById('capital').textContent = capital;

  let results = {};
  let index = 0;

  function spinSingle(i){
    if(i>=arr.length){
      // все колеса завершены
      let totalProfit = 0;
      arr.forEach(k=> totalProfit += results[k].profit);
      capital += totalInvest + totalProfit;
      document.getElementById('capital').textContent = capital;

      // таблица результатов с классами positive/negative
      let html = "<table><tr><th>Investment</th><th>Initial</th><th>Profit/Loss</th><th>Final</th></tr>";
      arr.forEach(k=>{
        const r = results[k];
        html += `<tr>
          <td>${k}</td>
          <td>${r.amount}</td>
          <td class="${r.profit>=0?'positive':'negative'}">${r.profit}</td>
          <td>${r.amount + r.profit}</td>
        </tr>`;
      });
      html += "</table>";
      message.innerHTML = html;

      // очистка полей
      arr.forEach(k=>document.getElementById(k).value="");
      return;
    }

    const key = arr[i];
    const info = investments[key];
    const rotationTarget = Math.random()*2*Math.PI;
    const spins = Math.random()*5 +5;
    const duration = 2000;
    const start = performance.now();

    spinSound.currentTime = 0;
    spinSound.play();

    function animate(time){
      const elapsed = time - start;
      const progress = Math.min(elapsed/duration,1);
      const ease = 1 - Math.pow(1-progress,3);
      const rotation = ease*spins*2*Math.PI + rotationTarget;
      drawWheel(info.values, info.ctx, info.radius, rotation);
      if(progress<1) requestAnimationFrame(animate);
      else{
        spinSound.pause();
        spinSound.currentTime = 0;
        const anglePer = 2*Math.PI/info.values.length;
        const indexValue = Math.floor(((2*Math.PI-rotationTarget)%(2*Math.PI))/anglePer);
        const value = info.values[indexValue>=0?indexValue:0];
        results[key] = {amount: amounts[key], profit: Math.floor(amounts[key]*value/100)};
        spinSingle(i+1);
      }
    }
    requestAnimationFrame(animate);
  }

  spinSingle(0);
});

// ---------------- Back to Menu ----------------
document.getElementById('backMenu').addEventListener('click',()=>{
  if(confirm("Do you really want to go back to the menu? Unsaved progress will be lost.")){
    location.href="menu.html";
  }
});
