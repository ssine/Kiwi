import { postJSON, setCookie } from '../common'
import React from 'react'
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog'
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { TextField } from 'office-ui-fabric-react/lib/TextField'

interface LoginDialogButtonState {
  hideDialog: boolean
}

export default class LoginDialogButton extends React.Component<{}, LoginDialogButtonState> {
  public state: LoginDialogButtonState = {
    hideDialog: true,
  }

  public render() {
    const { hideDialog } = this.state
    return (
      <div>
        <DefaultButton onClick={this._showDialog} text="Login" />

        <Dialog
          hidden={hideDialog}
          onDismiss={this._closeDialog}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Login'
          }}
          modalProps={{
            isBlocking: false,
            styles: { main: { maxWidth: 450 } },
          }}
        >
          <TextField label="Username" id="kiwi-login-name" />
          <TextField label="Password" id="kiwi-login-password" type="password" />
          <p id="kiwi-login-error-msg"></p>
          <DialogFooter>
            <PrimaryButton onClick={this._login} text="Login" />
            <DefaultButton onClick={this._closeDialog} text="Cancel" />
          </DialogFooter>
        </Dialog>
      </div>
    )
  }

  private _login = async () => {
    // post the request
    const res = await postJSON('login', {
      name: (document.getElementById('kiwi-login-name') as HTMLInputElement).value,
      password: (document.getElementById('kiwi-login-password') as HTMLInputElement).value
    })
    if (res.success) {
      setCookie('token', res.token, 365*24*60)
      window.location.reload()
    } else {
      document.getElementById('kiwi-login-error-msg').innerText = res.reason
    }
  }

  private _showDialog = (): void => {
    this.setState({ hideDialog: false })
  }

  private _closeDialog = (): void => {
    this.setState({ hideDialog: true })
  }

}
