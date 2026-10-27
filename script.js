let rawOutput='', activeTab='all';
const $=id=>document.getElementById(id);
function setExpr(v){$('expression').value=v;$('expression').focus()}
function switchTab(tab,btn){activeTab=tab;document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');renderOutput()}
function renderOutput(){
  if(!rawOutput){$('output').textContent='Run an expression to see output.';return}
  let s=rawOutput;
  if(activeTab==='tokens'){
    const i=s.indexOf('TOKEN TABLE');
    const j=s.indexOf('\nSYNTAX ANALYSIS',i);
    s=i>=0?s.slice(i,j>=0?j:undefined):'No token table available.';
  }
  $('output').textContent=s;
}
function tokenize(input){
  const tokens=[]; let i=0;
  while(i<input.length){
    const ch=input[i];
    if(/\s/.test(ch)){i++;continue}
    const start=i;
    if(/[A-Za-z_]/.test(ch)){
      i++;while(i<input.length&&/[A-Za-z0-9_]/.test(input[i]))i++;
      tokens.push({type:'IDENTIFIER',value:input.slice(start,i),pos:start+1});continue;
    }
    if(/[0-9]/.test(ch)||(ch==='.'&&/[0-9]/.test(input[i+1]||''))){
      let dots=0;
      while(i<input.length&&(/[0-9]/.test(input[i])||input[i]==='.')){
        if(input[i]==='.')dots++;
        i++;
      }
      const value=input.slice(start,i);
      if(dots>1) return {tokens,error:`Invalid number "${value}" at position ${start+1}.`,errorPos:start+1};
      tokens.push({type:'NUMBER',value,pos:start+1});continue;
    }
    if('+-*/()'.includes(ch)){
      const types={'+':'PLUS','-':'MINUS','*':'MULTIPLY','/':'DIVIDE','(':'LEFT_PAREN',')':'RIGHT_PAREN'};
      tokens.push({type:types[ch],value:ch,pos:start+1});i++;continue;
    }
    return {tokens,error:`Unexpected character "${ch}" at position ${start+1}.`,errorPos:start+1};
  }
  tokens.push({type:'EOF',value:'EOF',pos:input.length+1});
  return {tokens,error:null};
}
function parseExpression(){
  const expr=$('expression').value.trim();
  if(!expr){$('message').textContent='Enter an expression first.';return}
  const btn=$('parseBtn');btn.disabled=true;btn.innerHTML='<span class="loader"></span>Parsing';
  try{
    const lex=tokenize(expr);
    const visible=lex.tokens.filter(t=>t.type!=='EOF');
    const tokenLines=visible.map((t,i)=>`${String(i+1).padEnd(4)} ${t.type.padEnd(14)} ${JSON.stringify(t.value).padEnd(18)} ${t.pos}`).join('\n');
    let index=0, error=null;
    const current=()=>lex.tokens[index]||lex.tokens[lex.tokens.length-1];
    const consume=type=>{
      if(current().type===type){index++;return}
      if(!error)error=`Expected ${typeName(type)} at position ${current().pos}, but found ${current().value==='EOF'?'end of input':JSON.stringify(current().value)}.`;
      throw new Error(error);
    };
    const typeName=t=>({IDENTIFIER:'identifier',NUMBER:'number',PLUS:'+',MINUS:'-',MULTIPLY:'*',DIVIDE:'/',LEFT_PAREN:'(',RIGHT_PAREN:')',EOF:'end of input'}[t]||t);
    function F(){
      if(current().type==='LEFT_PAREN'){consume('LEFT_PAREN');E();consume('RIGHT_PAREN')}
      else if(current().type==='IDENTIFIER'||current().type==='NUMBER')index++;
      else {error=`Expected identifier, number, or "(" at position ${current().pos}, but found ${current().value==='EOF'?'end of input':JSON.stringify(current().value)}.`;throw new Error(error)}
    }
    function T(){F();while(current().type==='MULTIPLY'||current().type==='DIVIDE'){index++;F()}}
    function E(){T();while(current().type==='PLUS'||current().type==='MINUS'){index++;T()}}
    let valid=false, parseError=null;
    if(lex.error){parseError=lex.error}
    else{
      try{if(visible.length===0)throw new Error('Expression is empty.');E();if(current().type!=='EOF')throw new Error(`Unexpected token ${JSON.stringify(current().value)} at position ${current().pos}.`);valid=true}
      catch(e){parseError=e.message||error||'Syntax error.'}
    }
    const output=[];
    output.push('RECURSIVE DESCENT PARSER — OUTPUT');
    output.push('================================');
    output.push('');
    output.push('INPUT: '+expr);
    output.push('');
    output.push('TOKEN TABLE');
    output.push('-----------');
    output.push('No.  Token Type     Lexeme             Position');
    output.push('---  -------------  -----------------  --------');
    output.push(tokenLines||'(no tokens)');
    output.push('');
    output.push('SYNTAX ANALYSIS');
    output.push('---------------');
    if(valid){
      output.push('RESULT: VALID ARITHMETIC EXPRESSION');
      output.push('All tokens accepted; expression matches the grammar.');
    }else{
      output.push('RESULT: INVALID ARITHMETIC EXPRESSION');
      output.push('Error: '+(parseError||'Syntax error.'));
    }
    output.push('');
    output.push('PARSER STATISTICS');
    output.push('-----------------');
    output.push('Tokens processed : '+visible.length);
    output.push('Errors detected  : '+(valid?0:1));
    rawOutput=output.join('\n');activeTab='all';
    document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='all'));
    renderOutput();
    $('status').className='status '+(valid?'valid':'invalid');
    $('status').innerHTML='<span class="dot"></span><span>'+(valid?'Valid arithmetic expression':'Invalid arithmetic expression')+'</span>';
    $('resultTag').textContent=valid?'PARSE SUCCESS':'PARSE FAILED';
    $('message').textContent=valid?'All tokens accepted; expression matches the grammar.':(parseError||'The expression does not match the grammar.');
    $('tokens').textContent=visible.length;
    $('errors').textContent=valid?'0':'1';
    $('resultMini').textContent=valid?'VALID':'INVALID';
  }catch(e){
    $('status').className='status invalid';$('status').innerHTML='<span class="dot"></span><span>Parser error</span>';$('message').textContent=e.message;
  }finally{btn.disabled=false;btn.textContent='▶ Parse'}
}
$('expression').addEventListener('keydown',e=>{if(e.key==='Enter')parseExpression()});
