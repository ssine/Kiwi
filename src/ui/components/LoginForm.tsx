import React from 'react'
import {postJSON, setCookie, getCookie, removeCookie} from '../Common'
import './LoginForm.css'

const buttonStyle: React.CSSProperties = {
  margin: '10px auto 0px auto',
  paddingLeft: 10,
  paddingRight: 10,
}

const LoginForm: React.FC<{}> = () => {
  return getCookie('token') !== '' ? (
    <div>
      <div className="kiwi-login-status" style={{textAlign: 'center', margin: '10px 0 10px 0'}}>
        Logged in as <span style={{color: 'var(--lineColor)'}}>{getCookie('accountName')}</span> .
      </div>
      <button
        className="kiwi-menu-button"
        style={buttonStyle}
        onClick={_ => {
          removeCookie('token')
          removeCookie('accountName')
          window.location.reload()
        }}
      >
        Logout
      </button>
    </div>
  ) : (
    <div>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div className="kiwi-login-input">
          <input placeholder="Username" id="kiwi-login-name" />
        </div>
        <div className="kiwi-login-input">
          <input placeholder="Password" id="kiwi-login-password" type="password" />
        </div>
        <p style={{color: 'red', margin: '0', textAlign: 'center'}} id="kiwi-login-error-msg"></p>
      </div>
      <button
        className="kiwi-menu-button"
        style={buttonStyle}
        onClick={async _ => {
          const accountName = (document.getElementById('kiwi-login-name') as HTMLInputElement).value
          // post the request
          const res = await postJSON('login', {
            name: accountName,
            password: (document.getElementById('kiwi-login-password') as HTMLInputElement).value,
          })
          if (res.success) {
            setCookie('token', res.token, 365 * 24 * 3600)
            setCookie('accountName', accountName, 365 * 24 * 3600)
            window.location.reload()
          } else {
            document.getElementById('kiwi-login-error-msg').innerText = res.reason
          }
        }}
      >
        Login
      </button>
    </div>
  )
}

export default LoginForm
