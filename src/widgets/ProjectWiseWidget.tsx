/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useEffect, useRef, useState } from "react";
import { AbstractWidgetProps, StagePanelLocation, StagePanelSection, UiItemsProvider, WidgetState } from "@itwin/appui-abstract";
import { Alert } from "@itwin/itwinui-react";
import { KeySet } from "@itwin/presentation-common";
import { Presentation, SelectionChangeEventArgs } from "@itwin/presentation-frontend";

import "../css/Widget.scss";
import { useActiveIModelConnection, useActiveViewport } from "@itwin/appui-react";
import { IModelConnection } from "@itwin/core-frontend";
import { JSONTree } from "react-json-tree";


const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

const _executeQuery = async (imodel: IModelConnection, query: string) => {
  const rows = [];
  for await (const row of imodel.query(query))
    rows.push(row);

  return rows;
};

const ProjectWiseWidget = () => {
  const iModelConnection = useActiveIModelConnection();
  const viewport = useActiveViewport();


  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [pwAttributes, setPWAttributes] = useState({});
  const selectedElements = useRef<KeySet>(new KeySet());
  // const [elementsAreSelected, setElementsAreSelected] = useState<boolean>(false);


  // Initialize the widget
  useEffect(() => {
    const asyncInitialize = async () => {
      if (viewport) {
      }
    };
    if (!initialized) {
      void asyncInitialize().then(() => {
        setInitialized(true);
      });
    }
  }, [iModelConnection, viewport, initialized]);
  useEffect(() => {
    // Subscribe for unified selection changes
    // Change the default selection scope. Top-assembly scope returns key of selected element's topmost parent element (or just the element if it has no parents)
    Presentation.selection.scopes.activeScope = "top-assembly";
    Presentation.selection.selectionChange.addListener(_onSelectionChanged);
  },);


  const _onSelectionChanged = async (event: SelectionChangeEventArgs) => {
    let elements: string[] = [];
    selectedElements.current = new KeySet(event.keys);
    // setElementsAreSelected(!event.keys.isEmpty);
    selectedElements.current.instanceKeys.forEach((values, key) => {      
      elements = Array.from(values)

    });
    //console.log(elements);
    await getPWProps(elements[0]);
    //console.log(props);

  };

  const getPWProps = async (ecInstanceId : string) => {
    let pwReturn = ""
    if (!iModelConnection) {
      return pwReturn
    }
    const sql = "select esa.element.id as Id, rl.jsonproperties as pwproperties from bis.Externalsourceaspect esa join bis.externalsource es on esa.source.id = es.ecinstanceid join bis.repositorylink rl on rl.ecinstanceid = es.repository.id where esa.element.id = " + ecInstanceId
    
    try {
      const properties = await _executeQuery(iModelConnection, sql)
      for (const property of properties.values()) {
        //console.log(prop);
        const pwattributes = JSON.parse(property[1]);
        console.log(pwattributes);
        pwReturn =  pwattributes
        setPWAttributes(pwReturn)
      }
      return pwReturn
    }
    catch (e) {
      const err = e as Error
      console.log(`Caught Error : ${err.message}`)
      return pwReturn
    }

  }


  // When the button is toggled, display the realityModel and set its transparency to where the slider is currently set.
  return (
    <div>
      <div className="sample-options">
      <Alert type="informational" className="instructions">
        ProjectWise property panel.  Pick an element to display the ProjectWise properties
      </Alert>
      <div className="sample-options-col">
      <ul>
        <JSONTree data = {pwAttributes} invertTheme = {true} theme = {theme} hideRoot = {true}/>
      </ul>        
      </div></div>
    </div>
  );

};


export class ProjectWiseWidgetProvider implements UiItemsProvider {
  public readonly id: string = "ProjectWiseWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<AbstractWidgetProps> {
    const widgets: AbstractWidgetProps[] = [];
    if (location === StagePanelLocation.Right) {
      widgets.push(
        {
          id: "ProjectWiseDataWidget",
          label: "ProjectWise Properties",
          defaultState: WidgetState.Open,
          getWidgetContent: () => <ProjectWiseWidget />,
        }
      );
    }
    return widgets;
  }
}

