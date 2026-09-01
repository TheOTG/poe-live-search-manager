/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState, useEffect } from "react";
import { clipboard, ipcRenderer } from "electron";
import Box from "@mui/material/Box";
import MaterialTable from "@material-table/core";
import { Link } from "react-router-dom";
import { ipcEvents } from "../../../../shared/resources/IPCEvents/IPCEvents";
import GlobalStore from "../../../../shared/GlobalStore/GlobalStore";
import { storeKeys } from "../../../../shared/resources/StoreKeys/StoreKeys";
import * as tableColumns from "../../../resources/TableColumns/TableColumns";
import { deleteAllResults as deleteAllResultsMessageBoxOptions } from "../../../resources/MessageBoxOptions/MessageBoxOptions";
import {
  isDefined,
  devErrorLog,
  devLog,
} from "../../../../shared/utils/JavaScriptUtils/JavaScriptUtils";
import * as poeTrade from "../../../../main/poe-trade/poe-trade";
import soundBase64Data from "../../../../shared/resources/Audio/gong.mp3"

const gong = new Audio(soundBase64Data)

export default () => {
  const globalStore = GlobalStore.getInstance();

  const [results, setResults] = useState(
    globalStore.get(storeKeys.RESULTS, [])
  );

  const resultsLimit = globalStore.get(storeKeys.RESULTS_LIMIT, 100);

  function resultsUpdateListener(_, currentResults) {
    gong.currentTime = 0
    gong.volume = 0.3
    gong.play()
    setResults(currentResults);
  }

  useEffect(() => {
    ipcRenderer.on(ipcEvents.RESULTS_UPDATE, resultsUpdateListener);

    return () =>
      ipcRenderer.removeListener(
        ipcEvents.RESULTS_UPDATE,
        resultsUpdateListener
      );
  }, []);

  function teleport(result) {
    ipcRenderer.send(ipcEvents.TELEPORT_REQUEST, result)
  }

  function deleteResult(resultDetails) {
    const updatedResults = results.filter(
      result => result.id !== resultDetails.id
    );

    setResults(updatedResults);

    globalStore.set(storeKeys.RESULTS, updatedResults);
  }

  function deleteAll() {
    // devLog(`devlog delete all`)
    // console.log("console log delete all")
    ipcRenderer
      .invoke(ipcEvents.MESSAGE_DIALOG, deleteAllResultsMessageBoxOptions)
      .then(response => {
        const clickedButtonIndex = response.response;
        const deleteAllResultsConfirmed = clickedButtonIndex === 1;

        if (deleteAllResultsConfirmed) {
          setResults([]);

          globalStore.set(storeKeys.RESULTS, []);
        }
      });
  }

  return (
    <MaterialTable
      style={{ whiteSpace: "nowrap" }}
      components={{
        Pagination: () => (
          <Box component="td" padding={2} fontSize="13px">
            Result count: <b>{results.length}</b>
            <Link to="/settings" style={{ marginLeft: 3 }}>
              (limit: <b>{resultsLimit}</b>)
            </Link>
          </Box>
        ),
      }}
      columns={tableColumns.resultsScreen}
      data={results}
      actions={[
        result => ({
          icon: "file_copy",
          tooltip: "Copy whisper",
          onClick: () => teleport(result),
        }),
        result => ({
          icon: "delete",
          tooltip: "Delete",
          onClick: () => deleteResult(result),
        }),
        {
          icon: "delete_outline",
          tooltip: "Delete all",
          isFreeAction: true,
          onClick: () => deleteAll(),
          disabled: results.length === 0,
        },
      ]}
      options={{
        showTitle: false,
        toolbarButtonAlignment: "left",
        headerStyle: {
          position: "sticky",
          top: 0,
        },
        maxBodyHeight: "525px",
        pageSize: resultsLimit,
        emptyRowsWhenPaging: false,
      }}
    />
  );
};
