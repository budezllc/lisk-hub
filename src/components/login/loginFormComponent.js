import React from 'react';
import Cookies from 'js-cookie';
import grid from 'flexboxgrid/dist/flexboxgrid.css';
import Input from 'react-toolbox/lib/input';
import Dropdown from 'react-toolbox/lib/dropdown';
import Button from 'react-toolbox/lib/button';
import Checkbox from 'react-toolbox/lib/checkbox';
import { isValidPassphrase } from '../../utils/passphrase';
import networksRaw from './networks';
import Passphrase from '../passphrase';
import styles from './login.css';

// ignore else in coverage as it is hard to test and not our business logic
/* istanbul ignore else */
if (global._bitcore) delete global._bitcore;

/**
 * The container component containing login
 * and create account functionality
 */
class LoginFormComponent extends React.Component {
  constructor() {
    super();

    this.networks = networksRaw.map((network, index) => ({
      label: network.name,
      value: index,
    }));

    this.state = {
      passphrase: '',
      address: '',
      network: 0,
    };
  }

  componentDidMount() {
    // pre-fill passphrase and address if exiting in cookies
    this.devPreFill();
  }

  componentDidUpdate() {
    if (this.props.account && this.props.account.address) {
      this.props.history.replace('/main/transactions');
    }
  }

  validateUrl(value) {
    const addHttp = (url) => {
      const reg = /^(?:f|ht)tps?:\/\//i;
      return reg.test(url) ? url : `http://${url}`;
    };

    let addressValidity = '';
    try {
      const url = new URL(addHttp(value));
      addressValidity = url && url.port !== '' ? '' : 'URL is invalid';
    } catch (e) {
      addressValidity = 'URL is invalid';
    }

    const data = { address: value, addressValidity };
    this.setState(data);
    return data;
  }

  validatePassphrase(value) {
    const data = { passphrase: value };
    if (!value || value === '') {
      data.passphraseValidity = 'Empty passphrase';
    } else {
      data.passphraseValidity = isValidPassphrase(value) ? '' : 'Invalid passphrase';
    }

    this.setState(data);
    return data;
  }

  changeHandler(name, value) {
    this.setState({ [name]: value });
  }

  onLoginSubmission(passphrase) {
    const network = Object.assign({}, networksRaw[this.state.network]);
    if (this.state.network === 2) {
      network.address = this.state.address;
    }

    // set active peer
    this.props.activePeerSet({
      passphrase,
      network,
    });
  }

  devPreFill() {
    const address = Cookies.get('address');
    const passphrase = Cookies.get('passphrase');

    this.setState({ network: address ? 2 : 0 });
    this.validateUrl(address);
    this.validatePassphrase(passphrase);
  }

  render() {
    return (
      <form>
        <Dropdown
          auto={false}
          source={this.networks}
          onChange={this.changeHandler.bind(this, 'network')}
          label='Select a network'
          value={this.state.network}
          className='network'
        />
        {
          this.state.network === 2 &&
          <Input type='text' label='Node address' name='address' className='address'
            value={this.state.address} error={this.state.addressValidity}
            onChange={this.validateUrl.bind(this)} />
        }
        <Input type={this.state.showPassphrase ? 'text' : 'password'}
          label='Enter your passphrase' name='passphrase'
          className='passphrase'
          error={this.state.passphraseValidity === 'Invalid passphrase' ? 'Invalid passphrase' : ''}
          value={this.state.passphrase} onChange={this.validatePassphrase.bind(this)} />
        <Checkbox
          checked={this.state.showPassphrase}
          label="Show passphrase"
          className={`${grid['start-xs']} show-passphrase`}
          onChange={this.changeHandler.bind(this, 'showPassphrase')}
        />
        <footer className={ `${grid.row} ${grid['center-xs']}` }>
          <div className={grid['col-xs-12']}>
            <Button label='NEW ACCOUNT' flat primary
              className={`${styles.newAccount} new-account-button`}
              onClick={() => this.props.setActiveDialog({
                title: 'New Account',
                childComponent: Passphrase,
                childComponentProps: {
                  onPassGenerated: this.onLoginSubmission.bind(this),
                },
              })} />
            <Button label='LOGIN' primary raised
              onClick={this.onLoginSubmission.bind(this, this.state.passphrase)}
              className='login-button'
              disabled={(this.state.network === 2 && this.state.addressValidity !== '') ||
              this.state.passphraseValidity !== ''} />
          </div>
        </footer>
      </form>
    );
  }
}

export default LoginFormComponent;
