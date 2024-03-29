import { Express, Request, Response } from 'express';
import { DataBase, NodeSearchCriteria, NodeListOrder } from '@src/services/DataBase';
import { NotFoundError, InternalServerError, UnsupportedFilterError } from '@src/infrastructure/Error';
import { bitxor } from '@src/config';

enum NodeFilter {
	Preferred = 'preferred',
	Suggested = 'suggested',
}

export class Routes {
	static register = async (app: Express) => {
		app.get('/nodes', async (req: Request, res: Response) => {
			const { filter, limit, ssl, order } = req.query;

			let searchCriteria: NodeSearchCriteria = {
				filter: {},
				limit: Number(limit) || 0,
				order: order ? ((order as string).toLowerCase() as NodeListOrder) : NodeListOrder.Random,
			};

			// add ssl filter to query isHttpsEnabled nodes.
			if (ssl) {
				const isSSL = ssl.toString().toLocaleLowerCase() === 'true';

				Object.assign(searchCriteria.filter, {
					'apiStatus.isHttpsEnabled': isSSL,
					'apiStatus.webSocket.wss': isSSL,
					'apiStatus.webSocket.isAvailable': true,
					version: { $gte: bitxor.MIN_PARTNER_NODE_VERSION },
				});
			}

			// Return error message filter is not support
			if (filter && filter !== NodeFilter.Preferred && filter !== NodeFilter.Suggested) {
				return UnsupportedFilterError.send(res, filter as string);
			}

			// ?filter=preferred
			// it filters by host / domain name config by admin.
			if (filter === NodeFilter.Preferred) {
				if (!bitxor.PREFERRED_NODES?.length) {
					return Promise.resolve(res.send([]));
				}
				Object.assign(searchCriteria.filter, {
					host: { $in: bitxor.PREFERRED_NODES.map((node) => new RegExp(`^${node}`, 'i')) },
					'apiStatus.isAvailable': true,
					'apiStatus.nodeStatus.apiNode': 'up',
					'apiStatus.nodeStatus.db': 'up',
					version: { $gte: bitxor.MIN_PARTNER_NODE_VERSION },
				});
			}

			// ?filter=suggested
			// it filter health nodes
			if (filter === NodeFilter.Suggested) {
				Object.assign(searchCriteria.filter, {
					'apiStatus.isAvailable': true,
					'apiStatus.nodeStatus.apiNode': 'up',
					'apiStatus.nodeStatus.db': 'up',
					version: { $gte: bitxor.MIN_PARTNER_NODE_VERSION },
				});
			}

			return DataBase.getNodeList(searchCriteria)
				.then((nodes) => res.send(nodes))
				.catch((error) => InternalServerError.send(res, error));
		});

		app.get('/nodesHostDetail', (req: Request, res: Response) => {
			return DataBase.getNodesHostDetail()
				.then((nodes) => res.send(nodes))
				.catch((error) => InternalServerError.send(res, error));
		});

		app.get('/nodes/:publicKey', (req: Request, res: Response) => {
			const publicKey = req.params.publicKey;

			return DataBase.getNodeByPublicKey(publicKey)
				.then((node) => {
					if (node) res.send(node);
					else NotFoundError.send(res, 'publicKey', publicKey);
				})
				.catch((error) => InternalServerError.send(res, error));
		});

		app.get('/nodes/nodePublicKey/:nodePublicKey', (req: Request, res: Response) => {
			const nodePublicKey = req.params.nodePublicKey;

			return DataBase.getNodeByNodePublicKey(nodePublicKey)
				.then((node) => {
					if (node) {
						res.send(node);
					} else {
						NotFoundError.send(res, 'nodePublicKey', nodePublicKey);
					}
				})
				.catch((error) => InternalServerError.send(res, error));
		});

		app.get('/nodesStats', (req: Request, res: Response) => {
			return DataBase.getNodesStats()
				.then((stats) => res.send(stats))
				.catch((error) => InternalServerError.send(res, error));
		});

		app.get('/nodesHeightStats', (req: Request, res: Response) => {
			return DataBase.getNodeHeightStats()
				.then((stats) => res.send(stats))
				.catch((error) => InternalServerError.send(res, error));
		});

		app.get('/timeSeries/nodeCount', async (req: Request, res: Response) => {
			return DataBase.getNodeCountSeries()
				.then((data) => res.send(data))
				.catch((error) => InternalServerError.send(res, error));
		});
	};
}
