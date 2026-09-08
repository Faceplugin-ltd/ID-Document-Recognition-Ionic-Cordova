import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
/** Hash router: Cordova loads `…/index.html`, so BrowserRouter path `/index.html` matches nothing. */
import { IonReactHashRouter } from '@ionic/react-router';
import Home from './pages/Home';
import CameraPage from './pages/Camera';
import Gallery from './pages/Gallery';
import Result from './pages/Result';
import About from './pages/About';

setupIonicReact({ mode: 'ios' });

export default function App() {
  return (
    <IonApp>
      <IonReactHashRouter>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/camera" component={CameraPage} />
          <Route exact path="/gallery" component={Gallery} />
          <Route exact path="/result" component={Result} />
          <Route exact path="/about" component={About} />
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactHashRouter>
    </IonApp>
  );
}
