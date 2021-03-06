import React, { FC, useMemo, useState } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Alert } from 'reactstrap';
import { useQueryParams, withDefault, NumberParam } from 'use-query-params';
import { withStatusIndicator } from '../../../components/withStatusIndicator';
import { useFetch } from '../../../hooks/useFetch';
import PathPrefixProps from '../../../types/PathPrefixProps';
import { Block } from './block';
import { SourceView } from './SourceView';
import { BlockDetails } from './BlockDetails';
import { sortBlocks } from './helpers';
import styles from './blocks.module.css';
import TimeRange from './TimeRange';

export interface BlockListProps {
  blocks: Block[];
  err: string | null;
  label: string;
  refreshedAt: string;
}

export const BlocksContent: FC<{ data: BlockListProps }> = ({ data }) => {
  const [selectedBlock, selectBlock] = useState<Block>();

  const { blocks, label, err } = data;

  const blockPools = useMemo(() => sortBlocks(blocks, label), [blocks, label]);
  const [gridMinTime, gridMaxTime] = useMemo(() => {
    if (!err && blocks.length > 0) {
      let gridMinTime = blocks[0].minTime;
      let gridMaxTime = blocks[0].maxTime;
      blocks.forEach(block => {
        if (block.minTime < gridMinTime) {
          gridMinTime = block.minTime;
        }
        if (block.maxTime > gridMaxTime) {
          gridMaxTime = block.maxTime;
        }
      });
      return [gridMinTime, gridMaxTime];
    }
    return [0, 0];
  }, [blocks, err]);

  const [{ 'min-time': viewMinTime, 'max-time': viewMaxTime }, setQuery] = useQueryParams({
    'min-time': withDefault(NumberParam, gridMinTime),
    'max-time': withDefault(NumberParam, gridMaxTime),
  });

  const setViewTime = (times: [number, number]): void => {
    setQuery({
      'min-time': times[0],
      'max-time': times[1],
    });
  };

  if (err) return <Alert color="danger">{err.toString()}</Alert>;

  return (
    <>
      {blocks.length > 0 ? (
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.sources}>
              {Object.keys(blockPools).map(pk => (
                <SourceView
                  key={pk}
                  data={blockPools[pk]}
                  title={pk}
                  selectBlock={selectBlock}
                  gridMinTime={viewMinTime}
                  gridMaxTime={viewMaxTime}
                />
              ))}
            </div>
            <TimeRange
              gridMinTime={gridMinTime}
              gridMaxTime={gridMaxTime}
              viewMinTime={viewMinTime}
              viewMaxTime={viewMaxTime}
              onChange={setViewTime}
            />
          </div>
          <BlockDetails selectBlock={selectBlock} block={selectedBlock} />
        </div>
      ) : (
        <Alert color="warning">No blocks found.</Alert>
      )}
    </>
  );
};

const BlocksWithStatusIndicator = withStatusIndicator(BlocksContent);

export const Blocks: FC<RouteComponentProps & PathPrefixProps> = ({ pathPrefix = '' }) => {
  const { response, error, isLoading } = useFetch<BlockListProps>(`${pathPrefix}/api/v1/blocks`);
  const { status: responseStatus } = response;
  const badResponse = responseStatus !== 'success' && responseStatus !== 'start fetching';

  return (
    <BlocksWithStatusIndicator
      data={response.data}
      error={badResponse ? new Error(responseStatus) : error}
      isLoading={isLoading}
    />
  );
};

export default Blocks;
